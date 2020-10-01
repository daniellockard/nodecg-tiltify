`nodecg-tiltify` is a [NodeCG](http://github.com/nodecg/nodecg) bundle. It works with NodeCG versions which satisfy this [semver](https://docs.npmjs.com/getting-started/semantic-versioning) range: `^1.1.1`

You will need to have an appropriate version of NodeCG installed to use it.

## Setup

1. Add `nodecg-tiltify` to your [`nodecg.dependencies`](https://nodecg.com/docs/manifest/#nodecgbundledependencies) in your bundle's package.json
2. [Create an application for your Tiltify account](https://tiltify.github.io/api/topics/getting-started.html)
3. Take the Access Token from your application and add the following to `nodecg/cfg/nodecg-tiltify.json`:

```
{
	"tiltify_api_key": "KEY_HERE",
	"tiltify_campaign_id": "CAMPAIGN_HERE"
}
```

## Details

This bundle sets up [`NodeCG.Replicant`](https://nodecg.com/docs/classes/replicant/) objects in the `nodecg-tiltify` namespace.

Available Replicants from the Tiltify API:
- [X] `donations`\*
- [X] `alldonations`\*\*
- [X] `total`
- [X] `donationpolls`
- [X] `schedule`
- [X] `donations`
- [X] `challenges`
- [X] `rewards`
- [ ] `campaign`: (Coming soon)

The replicants convert results from the Tiltify API into objects, and more information on the exact format of the data from these replicants can be found in the [Tiltify API docs](https://tiltify.github.io/api/).

\*`donations` objects contain the additional properties `read` and `shown` which can be used to indicate if something was read in the dashboard or shown in a graphic. `donations` also only collects donations from the most recent 'page' of the Tiltify API.

\*\*`alldonations` contains all donations that have been made.
