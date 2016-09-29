//
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license.
//
// Microsoft Bot Framework: http://botframework.com
//
// Bot Builder SDK Github:
// https://github.com/Microsoft/BotBuilder
//
// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License:
// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED ""AS IS"", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//

import dlg = require('../dialogs/Dialog');
import dl = require('./Library');
import da = require('../dialogs/DialogAction');
import actions = require('../dialogs/ActionSet');
import sd = require('../dialogs/SimpleDialog');
import ses = require('../Session');
import bs = require('../storage/BotStorage');
import consts = require('../consts');
import utils = require('../utils');
import logger = require('../logger');
import async = require('async');
import events = require('events');

export interface IUniversalBotSettings {
    defaultDialogId?: string;
    defaultDialogArgs?: any;
    localizer?: ILocalizer;
    localizerSettings?: ILocalizerSettings;    
    lookupUser?: ILookupUser;
    processLimit?: number;
    autoBatchDelay?: number;
    storage?: bs.IBotStorage;
    persistUserData?: boolean;
    persistConversationData?: boolean;
    dialogErrorMessage?: string|string[]|IMessage|IIsMessage;
}

export interface IConnector {
    onEvent(handler: (events: IEvent[], cb?: (err: Error) => void) => void): void;
    send(messages: IMessage[], cb: (err: Error) => void): void;
    startConversation(address: IAddress, cb: (err: Error, address?: IAddress) => void): void;
}
interface IConnectorMap {
    [channel: string]: IConnector;    
}

export interface IMiddlewareMap {
    receive?: IEventMiddleware|IEventMiddleware[];
    send?: IEventMiddleware|IEventMiddleware[];
    botbuilder?: ses.ISessionMiddleware|ses.ISessionMiddleware[];
}

export interface IEventMiddleware {
    (event: IEvent, next: Function): void;
}

export interface ILookupUser {
    (address: IAddress, done: (err: Error, user: IIdentity) => void): void;
}

export class UniversalBot extends events.EventEmitter {
    private settings = <IUniversalBotSettings>{ 
        processLimit: 4, 
        persistUserData: true, 
        persistConversationData: false 
    };
    private connectors = <IConnectorMap>{}; 
    private lib = new dl.Library(consts.Library.default);
    private actions = new actions.ActionSet();
    private mwReceive = <IEventMiddleware[]>[];
    private mwSend = <IEventMiddleware[]>[];
    private mwSession = <ses.ISessionMiddleware[]>[]; 
    
    
    constructor(connector?: IConnector, settings?: IUniversalBotSettings) {
        super();
        this.lib.library(dl.systemLib);
        if (settings) {
            for (var name in settings) {
                if (settings.hasOwnProperty(name)) {
                    this.set(name, (<any>settings)[name]);
                }
            }
        }

        if (connector) {
            this.connector(consts.defaultConnector, connector);
            var asStorage: bs.IBotStorage = <any>connector;
            if (!this.settings.storage && 
                typeof asStorage.getData === 'function' &&
                typeof asStorage.saveData === 'function') {
                this.settings.storage = asStorage;
            }
        }
    }
    
    //-------------------------------------------------------------------------
    // Settings
    //-------------------------------------------------------------------------
    
    public set(name: string, value: any): this {
        (<any>this.settings)[name] = value;
        return this;
    }
    
    public get(name: string): any {
        return (<any>this.settings)[name];
    }
    
    //-------------------------------------------------------------------------
    // Connectors
    //-------------------------------------------------------------------------
    
    public connector(channelId: string, connector?: IConnector): IConnector {
        var c: IConnector;
        if (connector) {
            this.connectors[channelId || consts.defaultConnector] = c = connector;
            c.onEvent((events, cb) => this.receive(events, cb));
        } else if (this.connectors.hasOwnProperty(channelId)) {
            c = this.connectors[channelId];
        } else if (this.connectors.hasOwnProperty(consts.defaultConnector)) {
            c = this.connectors[consts.defaultConnector];
        }
        return c;
    }
    
    //-------------------------------------------------------------------------
    // Library Management
    //-------------------------------------------------------------------------

    public dialog(id: string, dialog?: dlg.Dialog | da.IDialogWaterfallStep[] | da.IDialogWaterfallStep): dlg.Dialog {
        return this.lib.dialog(id, dialog);
    }

    public library(lib: dl.Library|string): dl.Library {
        return this.lib.library(lib);
    }

    //-------------------------------------------------------------------------
    // Middleware
    //-------------------------------------------------------------------------
    
    public use(...args: IMiddlewareMap[]): this {
        args.forEach((mw) => {
            var added = 0;
            if (mw.receive) {
                Array.prototype.push.apply(this.mwReceive, Array.isArray(mw.receive) ? mw.receive : [mw.receive]);
                added++;
            }
            if (mw.send) {
                Array.prototype.push.apply(this.mwSend, Array.isArray(mw.send) ? mw.send : [mw.send]);
                added++;
            }
            if (mw.botbuilder) {
                Array.prototype.push.apply(this.mwSession, Array.isArray(mw.botbuilder) ? mw.botbuilder : [mw.botbuilder]);
                added++;
            }
            if (added < 1) {
                console.warn('UniversalBot.use: no compatible middleware hook found to install.')
            }
        });
        return this;    
    }

    //-------------------------------------------------------------------------
    // Actions
    //-------------------------------------------------------------------------

    public beginDialogAction(name: string, id: string, options?: actions.IDialogActionOptions): this {
        this.actions.beginDialogAction(name, id, options);
        return this;
    }

    public endConversationAction(name: string, msg?: string|string[]|IMessage|IIsMessage, options?: actions.IDialogActionOptions): this {
        this.actions.endConversationAction(name, msg, options);
        return this;
    }

    
    //-------------------------------------------------------------------------
    // Messaging
    //-------------------------------------------------------------------------
    
    public receive(events: IEvent|IEvent[], done?: (err: Error) => void): void {
        var list: IEvent[] = Array.isArray(events) ? events : [events]; 
        async.eachLimit(list, this.settings.processLimit, (message: IMessage, cb: (err: Error) => void) => {
            message.agent = consts.agent;
            message.type = message.type || consts.messageType;
            this.lookupUser(message.address, (user) => {
                if (user) {
                    message.user = user;
                }
                this.emit('receive', message);
                this.eventMiddleware(message, this.mwReceive, () => {
                    if (this.isMessage(message)) {
                        this.emit('incoming', message);
                        var userId = message.user.id;
                        var conversationId = message.address.conversation ? message.address.conversation.id : null;
                        var storageCtx: bs.IBotStorageContext = { 
                            userId: userId, 
                            conversationId: conversationId, 
                            address: message.address,
                            persistUserData: this.settings.persistUserData,
                            persistConversationData: this.settings.persistConversationData 
                        };
                        this.route(storageCtx, message, this.settings.defaultDialogId || '/', this.settings.defaultDialogArgs, cb);
                    } else {
                        // Dispatch incoming activity
                        this.emit(message.type, message);
                        cb(null);
                    }
                }, cb);
            }, cb);
        }, this.errorLogger(done));
    }
 
    public beginDialog(address: IAddress, dialogId: string, dialogArgs?: any, done?: (err: Error) => void): void {
        this.lookupUser(address, (user) => {
            var msg = <IMessage>{
                type: consts.messageType,
                agent: consts.agent,
                source: address.channelId,
                sourceEvent: {},
                address: utils.clone(address),
                text: '',
                user: user
            };
            this.ensureConversation(msg.address, (adr) => {
                msg.address = adr;
                var conversationId = msg.address.conversation ? msg.address.conversation.id : null;
                var storageCtx: bs.IBotStorageContext = { 
                    userId: msg.user.id, 
                    conversationId: conversationId,
                    address: msg.address,
                    persistUserData: this.settings.persistUserData,
                    persistConversationData: this.settings.persistConversationData 
                };
                this.route(storageCtx, msg, dialogId, dialogArgs, this.errorLogger(done), true);
            }, this.errorLogger(done));
        }, this.errorLogger(done));
    }
    
    public send(messages: IIsMessage|IMessage|IMessage[], done?: (err: Error) => void): void {
        var list: IMessage[];
        if (Array.isArray(messages)) {
            list = messages;
        } else if ((<IIsMessage>messages).toMessage) {
            list = [(<IIsMessage>messages).toMessage()];
        } else {
            list = [<IMessage>messages];
        }
        async.eachLimit(list, this.settings.processLimit, (message, cb) => {
            this.ensureConversation(message.address, (adr) => {
                message.address = adr;
                this.emit('send', message);
                this.eventMiddleware(message, this.mwSend, () => {
                    this.emit('outgoing', message);
                    cb(null);
                }, cb);
            }, cb);
        }, this.errorLogger((err) => {
            if (!err) {
                this.tryCatch(() => {
                    // All messages should be targeted at the same channel.
                    var channelId = list[0].address.channelId;
                    var connector = this.connector(channelId);
                    if (!connector) {
                        throw new Error("Invalid channelId='" + channelId + "'");
                    }
                    connector.send(list, this.errorLogger(done));
                }, this.errorLogger(done));
            } else if (done) {
                done(null);
            }
        }));
    }

    public isInConversation(address: IAddress, cb: (err: Error, lastAccess: Date) => void): void {
        this.lookupUser(address, (user) => {
            var conversationId = address.conversation ? address.conversation.id : null;
            var storageCtx: bs.IBotStorageContext = { 
                userId: user.id, 
                conversationId: conversationId, 
                address: address,
                persistUserData: false,
                persistConversationData: false 
            };
            this.getStorageData(storageCtx, (data) => {
                var lastAccess: Date;
                if (data && data.privateConversationData && data.privateConversationData.hasOwnProperty(consts.Data.SessionState)) {
                    var ss: ISessionState = data.privateConversationData[consts.Data.SessionState];
                    if (ss && ss.lastAccess) {
                        lastAccess = new Date(ss.lastAccess);
                    }
                }
                cb(null, lastAccess);
            }, this.errorLogger(<any>cb));
        }, this.errorLogger(<any>cb));
    }

    //-------------------------------------------------------------------------
    // Helpers
    //-------------------------------------------------------------------------
    
    private route(storageCtx: bs.IBotStorageContext, message: IMessage, dialogId: string, dialogArgs: any, done: (err: Error) => void, newStack = false): void {
        // --------------------------------------------------------------------
        // Theory of Operation
        // --------------------------------------------------------------------
        // The route() function is called for both reactive & pro-active 
        // messages and while they generally work the same there are some 
        // differences worth noting.
        //
        // REACTIVE:
        // * The passed in storageKey will have the normalized userId and the
        //   conversationId for the incoming message. These are used as keys to
        //   load the persisted userData and conversationData objects.
        // * After loading data from storage we create a new Session object and
        //   dispatch the incoming message to the active dialog.
        // * As part of the normal dialog flow the session will call onSave() 1 
        //   or more times before each call to onSend().  Anytime onSave() is 
        //   called we'll save the current userData & conversationData objects
        //   to storage.
        //
        // PROACTIVE:
        // * Proactive follows essentially the same flow but the difference is 
        //   the passed in storageKey will only have a userId and not a 
        //   conversationId as this is a new conversation.  This will cause use
        //   to load userData but conversationData will be set to {}.
        // * When onSave() is called for a proactive message we don't know the
        //   conversationId yet so we can't actually save anything. The first
        //   call to this.send() results in a conversationId being assigned and
        //   that's the point at which we can actually save state. So we'll update
        //   the storageKey with the new conversationId and then manually trigger
        //   saving the userData & conversationData to storage.
        // * After the first call to onSend() for the conversation everything 
        //   follows the same flow as for reactive messages.
        var loadedData: bs.IBotStorageData;
        this.getStorageData(storageCtx, (data) => {
            // Initialize session
            var session = new ses.Session({
                localizer: this.settings.localizer,
                localizerSettings: this.settings.localizerSettings,
                autoBatchDelay: this.settings.autoBatchDelay,
                library: this.lib,
                actions: this.actions,
                middleware: this.mwSession,
                dialogId: dialogId,
                dialogArgs: dialogArgs,
                dialogErrorMessage: this.settings.dialogErrorMessage,
                onSave: (cb) => {
                    var finish = this.errorLogger(cb);
                    loadedData.userData = utils.clone(session.userData);
                    loadedData.conversationData = utils.clone(session.conversationData);
                    loadedData.privateConversationData = utils.clone(session.privateConversationData);
                    loadedData.privateConversationData[consts.Data.SessionState] = session.sessionState;
                    this.saveStorageData(storageCtx, loadedData, finish, finish);
                },
                onSend: (messages, cb) => {
                    this.send(messages, cb);
                }
            });
            session.on('error', (err: Error) => this.emitError(err));
            
            // Initialize session data
            var sessionState: ISessionState;
            session.userData = data.userData || {};
            session.conversationData = data.conversationData || {};
            session.privateConversationData = data.privateConversationData || {};
            if (session.privateConversationData.hasOwnProperty(consts.Data.SessionState)) {
                sessionState = newStack ? null : session.privateConversationData[consts.Data.SessionState];
                delete session.privateConversationData[consts.Data.SessionState];
            }
            loadedData = data;  // We'll clone it when saving data later
            
            // Dispatch message
            this.emit('routing', session);
            session.dispatch(sessionState, message);
            done(null);
        }, done);
    }

    private eventMiddleware(event: IEvent, middleware: IEventMiddleware[], done: Function, error?: (err: Error) => void): void {
        var i = -1;
        var _this = this;
        function next() {
            if (++i < middleware.length) {
                _this.tryCatch(() => {
                    middleware[i](event, next);
                }, () => next());
            } else {
                _this.tryCatch(() => done(), error);
            }
        }
        next();
    }

    private isMessage(message: IMessage): boolean {
        return (message && message.type && message.type.toLowerCase() == consts.messageType);
    }
    
    private ensureConversation(address: IAddress, done: (adr: IAddress) => void, error?: (err: Error) => void): void {
        this.tryCatch(() => {
            if (!address.conversation) {
                var connector = this.connector(address.channelId);
                if (!connector) {
                    throw new Error("Invalid channelId='" + address.channelId + "'");
                }
                connector.startConversation(address, (err, adr) => {
                    if (!err) {
                        this.tryCatch(() => done(adr), error);
                    } else if (error) {
                        error(err);
                    }
                });
            } else {
                this.tryCatch(() => done(address), error);
            }
        }, error);
    }
    
    private lookupUser(address: IAddress, done: (user: IIdentity) => void, error?: (err: Error) => void): void {
        this.tryCatch(() => {
            this.emit('lookupUser', address);
            if (this.settings.lookupUser) {
                this.settings.lookupUser(address, (err, user) => {
                    if (!err) {
                        this.tryCatch(() => done(user || address.user), error);
                    } else if (error) {
                        error(err);
                    }
                });
            } else {
                this.tryCatch(() => done(address.user), error);
            }
        }, error);
    }
    
    private getStorageData(storageCtx: bs.IBotStorageContext, done: (data: bs.IBotStorageData) => void, error?: (err: Error) => void): void {
        this.tryCatch(() => {
            this.emit('getStorageData', storageCtx);
            var storage = this.getStorage();
            storage.getData(storageCtx, (err, data) => {
                if (!err) {
                    this.tryCatch(() => done(data || {}), error);
                } else if (error) {
                    error(err);
                } 
            });  
        }, error);
    }
    
    private saveStorageData(storageCtx: bs.IBotStorageContext, data: bs.IBotStorageData, done?: Function, error?: (err: Error) => void): void {
        this.tryCatch(() => {
            this.emit('saveStorageData', storageCtx);
            var storage = this.getStorage();
            storage.saveData(storageCtx, data, (err) => {
                if (!err) {
                    if (done) {
                        this.tryCatch(() => done(), error);
                    }
                } else if (error) {
                    error(err);
                } 
            });  
        }, error);
    }

    private getStorage(): bs.IBotStorage {
        if (!this.settings.storage) {
            this.settings.storage = new bs.MemoryBotStorage();
        }
        return this.settings.storage;
    }
    
    private tryCatch(fn: Function, error?: (err?: Error) => void): void {
        try {
            fn();
        } catch (e) {
            try {
                if (error) {
                    error(e);
                }
            } catch (e2) {
                this.emitError(e2);
            }
        }
    }

    private errorLogger(done?: (err: Error) => void): (err: Error) => void {
        return (err: Error) => {
            if (err) {
                this.emitError(err);
            }
            if (done) {
                done(err);
                done = null;
            }
        };
    }
     
    private emitError(err: Error): void {
        var e = err instanceof Error ? err : new Error(err.toString());
        if (this.listenerCount('error') > 0) {
            this.emit('error', e);
        } else {
            console.error(e.stack);
        }
    }
}