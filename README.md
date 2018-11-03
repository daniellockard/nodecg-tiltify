tiltify-api is a [NodeCG](http://github.com/nodecg/nodecg) bundle. 
It works with NodeCG versions which satisfy this [semver](https://docs.npmjs.com/getting-started/semantic-versioning) range: `^1.1.1`
You will need to have an appropriate version of NodeCG installed to use it.


This bundle sets up a Replicant in the `tiltify-api` namespace, called `donations`.  It contains all of the donations that we've seen from the Tiltify API. It does NOT use pagination to get donations past the current "page". It also exposes a Replicant called `total` in the same namespace that shows how much Tiltify says we've raised so far!

Each element in `donations` is given a `read` and `shown` property. Typically, I would use these to determine if a donation has been `shown` on whatever `graphic` you're trying to show it on, and to mark whether or not is has been `read` on whatever `dashboard` you're presenting donations to be read on.

A donation object has an `amount`, a `name`, a `comment`, use them to do with them what you will. 

You need to set up the config in `cfg/tiltify-api.json` to look something like this:
```
{
	"tiltify_api_key": "KEY_HERE",
	"tiltify_campaign_id": "CAMPAIGN_HERE"
}
```

