# bedrock-authn-token-http
HTTP API for bedrock-authn-token

## Usage
This module requires the use of Express sessions. There are two requirements
for properly implementing sessions in a Bedrock application.

First, Express sessions must be enabled via the Bedrock config.
```js
import bedrock from 'bedrock';
import 'bedrock-express';

bedrock.config.express.useSession = true;
```

Second, an Express session store must be integrated into the Bedrock
application. [bedrock-session-mongod](https://github.com/digitalbazaar/bedrock-session-mongodb)
is commonly used for this purpose. Without a proper session store, the in-memory
store included with Express will cause memory leaks.
