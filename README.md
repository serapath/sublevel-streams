# sublevel-streams
use `level-sublevel` like data structure that utilizes streams for data bindings in frontend components

# usage
`npm install sublevel-streams`

```js
var sublevelStreams = require('sublevel-streams')

var o = { state: {}, subDBs: {}, prefix: [] }
var db = sublevelStreams(o)

console.log(o)

// @TODO: show usage

```
