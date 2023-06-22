`nodecg-tiltify` is a [NodeCG](http://github.com/nodecg/nodecg) bundle. It works with NodeCG versions which satisfy this [semver](https://docs.npmjs.com/getting-started/semantic-versioning) range: `^1.1.1`

You will need to have an appropriate version of NodeCG installed to use it.

## v5 API Changes

Re-complete setup, fields in the configuration have changed!

`challenges` -> `targets` replicant renamed to match tiltify.

Data is polled less frequently due to rate limits and webhook option.

If used in tandem with `nodecg-tiltify-donation-reader` that must ALSO be updated to v5 build


## Setup

1. Add `nodecg-tiltify` to your [`nodecg.dependencies`](https://nodecg.com/docs/manifest/#nodecgbundledependencies) in your bundle's package.json
2. [Create an application for your Tiltify account](https://tiltify.github.io/api/topics/getting-started.html). Use your nodecg basepath + `/nodecg-tiltify/callback` as your Redirect URI
3. Take the client id and secret from your application and add to configuration
4. Lastly, provide the campaign id in the configuration. It can be found in the tiltify dashboard under Setup -> Information -> Public ID. Do not use Legacy ID
```
nodecg/cfg/nodecg-tiltify.json
{
	"tiltify_redirect_uri": "BASEPATH/nodecg-tiltify/callback",
	"tiltify_client_id": "KEY_HERE",
	"tiltify_client_secret": "KEY_HERE",
	"tiltify_webhook_id": "ID_HERE",
	"tiltify_webhook_secret": "KEY_HERE",
	"tiltify_campaign_id": "CAMPAIGN_HERE"
}
```

### Setup Webhooks (Recommended)

Webhooks make donations and donation total updates come in realtime, it's recommended!

1. Create a webhook within your newly created application, the endpoint URL will be the basepath of your nodecg + `/nodecg-tiltify/webhook`

		It must be on the world wide web, for example: `https://nodecg.example.com/nodecg-tiltify/webhook`

2. Take webhook secret and add to configuration `tiltify_webhook_secret`, in the same file as in setup
3. Take webhook ID and add it to configuration `tiltify_webhook_id`. The ID is the second UUID in the url for the page on tiltify.

## Details

This bundle sets up [`NodeCG.Replicant`](https://nodecg.com/docs/classes/replicant/) objects in the `nodecg-tiltify` namespace.

Available Replicants from the Tiltify API:
- [X] `donations`\*
- [X] `alldonations`\*\*
- [X] `total`
- [X] `donationpolls`
- [ ] `donationmatches`: (Coming soon)
- [X] `schedule`
- [X] `donations`
- [X] `targets`
- [X] `rewards`
- [ ] `campaign`: (Coming soon)

The replicants convert results from the Tiltify API into objects, and more information on the exact format of the data from these replicants can be found in the [Tiltify API docs](https://developers.tiltify.com/docs/intro).

\*`donations` objects contain the additional properties `read` and `shown` which can be used to indicate if something was read in the dashboard or shown in a graphic. `donations` updates when the webhook posts an incoming donation, if webhooks are diabled `donations` also only collects donations from the most recent 'page' of the Tiltify API.

\*\*`alldonations` contains all donations that have been made.

This bundle also has 3 messages that it listens for that can be sent using
`nodecg.sendMessageToBundle`
* `clear-donations` - Marks all donations as read
* `mark-donation-as-read` - marks a specific donation as read
* `mark-donation-as-shown` - marks a specific donation as shown

Note: this should be done in the form of
`nodecg.sendMessageToBundle('clear-donation', 'nodecg-tiltify')` or
`nodecg.sendMessageToBundle('mark-donation-as-read', 'nodecg-tiltify', donationObject`. The donation object sent to shown or read needs to at least
have the donation ID so that the back end can find and mark.


