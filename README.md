# appfollow-api
A JS wrapper for the AppFollow API.

# Installation
```shell
npm install --save appfollow-api
```

# Usage
To execute AppFollow APIs, you need your **API secret** and **cleint ID**. For the details about the API, see [AppFollow help center](https://appfollow.zendesk.com/hc/en-us/articles/209547629-API-Description-Methods-Examples).

```js
var AppFollow = require('appfollow-api');
AppFollow.api('your-api-secret')
    .apps({cid: 'your-client-id'}, function (err, result) {
        console.log(result);
    });
```
