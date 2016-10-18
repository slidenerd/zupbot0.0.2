'use strict'

const cache = {
	get: function(){
		return ''
	}
}
const flipkart = {
	paginator: null,
	triggers: {
		none: '',
		first: '',
		subsequent: '',
		done: ''
	}
}

const platforms = {
	getCarouselLimits: function(channelId){
		return 10
	}
}
const session = {
	message: {
		address:{
			channelId: 'test'
		}
	},
	userData: {
		user: {
			flipkart: {
				page: 0
			}
		}
	}
}



flipkart.paginator = function (session, offers) {
    //How many items will you display in a carousel on each platform is controlled by limit
    let limit = platforms.getCarouselLimits(session.message.address.channelId);

    //A key from cache which indicates if this data was previously cached or freshly loaded
    if (cache.get('fresh')) {
        session.userData.user.flipkart.page = 0
    }
    //Begin displaying items either from 0 or from a previous number
    let start = session.userData.user.flipkart.page

    //Display exactly limit number of items
    let end = (start + limit < offers.length) ? (start + limit) : offers.length

    let page;

    //We did not find any offers perhaps because there was none or all were unavailable or we got no results after applying our filter
    if ((end - start) === 0) {
        page = {
            triggerName: flipkart.triggers.none,
            offers: [],
            start: 0,
            end: 0,
            count: offers.length
        }
    }
    //If we found results but this is the first time we are paginating through them
    else if ((end - start) > 0 && start === 0) {
        page = {
            triggerName: flipkart.triggers.first,
            offers: offers.slice(start, end),
            start: start,
            end: end,
            count: offers.length
        }
    }
    //If we found results and this is not the first page of results that we are viewing
    else if ((end - start) > 0) {
        page = {
            triggerName: flipkart.triggers.subsequent,
            offers: offers.slice(start, end),
            start: start,
            end: end,
            count: offers.length
        }
    }
    //if we browsed every result and there is nothing else left to browse
    else {
        page = {
            triggerName: flipkart.triggers.done,
            offers: [],
            start: 0,
            end: 0,
            count: offers.length
        }
    }
    session.userData.user.flipkart.page = (end == offers.length)? 0 : end
    return page;
}

let offers = [1 ,2 ,3 ,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21]
let page1 = flipkart.paginator(session, offers)
let page2 = flipkart.paginator(session, offers)
let page3 = flipkart.paginator(session, offers)
let page4 = flipkart.paginator(session, offers)
console.log(page1)
console.log(page2)
console.log(page3)
console.log(page4)
