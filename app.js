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

getFollowingUsers()
	.then(users => {
		console.log(users.length);
	})
	.catch(err => {
		console.log(err);
	});