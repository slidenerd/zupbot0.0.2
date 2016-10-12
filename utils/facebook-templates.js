const templates = {}

templates.greet = function () {
    return {
        setting_type: "greeting",
        greeting: {
            text: "Yoo-hoo {{user_first_name}}, I am Zup, your smart buddy. You can ask me something like \"get me some offers today?\" and I will get you the best ones from Flipkart as long as rats arent chewing their server wires."
        }
    }
}

templates.getStarted = function () {
    return {
        setting_type: "call_to_actions",
        thread_state: "new_thread",
        call_to_actions: [
            {
                payload: "PAYLOAD_GET_STARTED"
            }
        ]
    }
}

templates.getPersistentMenu = function () {
    return {
        setting_type: "call_to_actions",
        thread_state: "existing_thread",
        call_to_actions: [
            {
                type: "postback",
                title: "Help",
                payload: "PAYLOAD_PERSISTENT_MENU_HELP"
            },
            {
                type: "web_url",
                title: "Checkout zup",
                url: "https://zup.chat/"
            }
        ]
    }
}

templates.getDomainWhitelisting = function () {
    return {
        setting_type: "domain_whitelisting",
        whitelisted_domains: ["https://zup.chat"],
        domain_action_type: "add"
    }
}

templates.getTextQuickReplies = function (text, titles, payloads) {
    let quick_replies = []
    for (let i = 0; i < titles.length && i < payloads.length; i++) {
        quick_replies.push({
            content_type: 'text',
            title: titles[i],
            payload: payloads[i]
        })
    }
    return {
        text: text,
        quick_replies: quick_replies
    }
}

templates.getGeolocationTemplate = function (userId, message) {
    return {
        recipient: {
            id: userId
        },
        message: {
            text: message,
            quick_replies: [
                {
                    "content_type": "location"
                }
            ]
        }
    }
}

templates.getWebViewButtonTemplate = function (userId, text, url, urlTitle, webViewRatio) {
    return {
        recipient: {
            id: userId
        },
        message: {
            attachment: {
                type: "template",
                payload: {
                    template_type: "button",
                    text: text,
                    buttons: [
                        {
                            type: "web_url",
                            url: url,
                            title: urlTitle,
                            webview_height_ratio: webViewRatio
                        }
                    ]
                }
            }
        }
    }
}
module.exports = templates;