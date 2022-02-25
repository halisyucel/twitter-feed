require('dotenv').config();
const axios = require('axios');

const getFollowingUsers = async () => {
	const variables = {
		userId: process.env.USER_ID,
		count: 500,
		includePromotedContent: false,
		withSuperFollowsUserFields: false,
		withDownvotePerspective: false,
		withReactionsMetadata: false,
		withReactionsPerspective: false,
		withSuperFollowsTweetFields: false
	};
	const users = [];
	let isDone = false;
	let cursor = null;
	while (!isDone) {
		const response = await axios({
			method: 'get',
			url: `https://twitter.com/i/api/graphql/rmZGQ1NwDXKVmRB1XBfm2w/Following?variables=${JSON.stringify(cursor === null ? variables : { ...variables, cursor })}`,
			headers: {
				'authorization': process.env.TWITTER_ACCESS_KEY,
				'cookie': `auth_token=${process.env.AUTH_TOKEN}; ct0=${process.env.CTO};`,
				'x-csrf-token': process.env.X_CSRF_TOKEN
			}
		});
		const data = response.data.data;
		let entries = data['user']['result']['timeline']['timeline']['instructions'].filter(i => i['type'] === 'TimelineAddEntries')[0].entries;
		cursor = entries.filter(i => i.entryId.substring(0,14) === 'cursor-bottom-')[0].content.value;
		entries = entries.filter(i => i.entryId.substring(0,5) === 'user-').map(entry => {
			return {
				id: entry['content']['itemContent']['user_results']['result']['id'],
				userId: entry.entryId.substring(5),
				entryId: entry.entryId,
				sortIndex: entry.sortIndex,
				name: entry['content']['itemContent']['user_results']['result']['legacy']['name'],
				screenName: entry['content']['itemContent']['user_results']['result']['legacy']['screen_name'],
				profileUrl: `https://twitter.com/${entry['content']['itemContent']['user_results']['result']['legacy']['screen_name']}`,
				profileImage: entry['content']['itemContent']['user_results']['result']['legacy']['profile_image_url_https'],
				verified: entry['content']['itemContent']['user_results']['result']['legacy']['verified'],
			};
		});
		entries.forEach(entry => {
			users.push(entry);
		});
		if (cursor.substring(0,2) === '0|') {
			isDone = true;
		}
	}
	return users;
};

const getUserTimeline = async ({
   userId,
   timestamp=Date.now() - (1000 * 60 * 60 * 24 * 7),
   intervals=[],
   count=50,

}) => {
	const variables = {
		"userId": `${userId}`,
		"count": count,
		"includePromotedContent": true,
		"withCommunity": true,
		"withSuperFollowsUserFields": true,
		"withDownvotePerspective": false,
		"withReactionsMetadata": false,
		"withReactionsPerspective": false,
		"withSuperFollowsTweetFields": true,
		"withVoice": true,
		"withV2Timeline": true,
	}
	const tweets = {};
	let isDone = false;
	let cursor = null;
	while (!isDone) {
		const response = await axios({
			method: 'get',
			url: `https://twitter.com/i/api/graphql/uNgNblRaPIcxuy60UEx6fA/UserTweetsAndReplies?variables=${JSON.stringify(cursor === null ? variables : { ...variables, cursor })}`,
			headers: {
				'authorization': process.env.TWITTER_ACCESS_KEY,
				'cookie': `auth_token=${process.env.AUTH_TOKEN}; ct0=${process.env.CTO};`,
				'x-csrf-token': process.env.X_CSRF_TOKEN
			}
		});
		const data = response.data.data;
		let entries = data['user']['result']['timeline_v2']['timeline']['instructions'].filter(i => i['type'] === 'TimelineAddEntries')[0]['entries'];
		cursor = entries.filter(i => i.entryId.substring(0,14) === 'cursor-bottom-')[0].content.value;
		entries = entries.filter(i => i.entryId.substring(0,6) === 'tweet-').map(entry => {
			return {
				id: entry['content']['itemContent']['tweet_results']['result']['rest_id'],
				tweetId: entry.entryId.substring(6),
				entryId: entry.entryId,
				sortIndex: entry.sortIndex,
				createdAt: (new Date(entry['content']['itemContent']['tweet_results']['result']['legacy']['created_at'])).getTime(),
				entry: entry
			};
		});
		for (const entry of entries) {
			if (intervals.length === 0) {
				if (entry.createdAt > timestamp) {
					if (!tweets.hasOwnProperty(entry.entryId))
						tweets[entry.entryId] = entry;
				} else {
					isDone = true;
					break;
				}
			} else {
				if (entry.createdAt > timestamp && entry.createdAt < intervals[0]) {
					if (!tweets.hasOwnProperty(entry.entryId))
						tweets[entry.entryId] = entry;
				} else {
					isDone = true;
					break;
				}
			}
		}
		console.log(entries.length);
		if (entries.length === 0)
			break;
		console.log(Object.keys(tweets).length);
	}
	return tweets;
}
getUserTimeline({
	userId: '873701851211997185',
})
	.then(res => {
		console.log(res.length);
	})