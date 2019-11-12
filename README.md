# passport-cortex

> A [PassportJS](http://www.passportjs.org/) strategy for [Palo Alto Networks Cortex](https://www.paloaltonetworks.com/detection-response)

This library makes it easy for any express, koa, or other NodeJS app using
Passport to perform OAuth2 authentication with Palo Alto Networks Cortex. This
authentication grants the app access to logs stored in the [Cortex Data
Lake](https://www.paloaltonetworks.com/detection-response/data-lake).

## Install

    npm install --save passport-cortex

## Simple example

> Single datalake, just to get things working quickly

Create two API endpoints in your app, one for auth redirection and one for the auth
callback.

Here's an example using express:

```javascript
const express = require('express')
const passport = require('passport')
const CortexStrategy = require('passport-cortex').CortexStrategy

const app = express()

// other express setup here

passport.use(new CortexStrategy(
  {
    clientID: PAN_CLIENT_ID,
    clientSecret: PAN_CLIENT_SECRET,
    callbackURL: 'https://<myserver>/cortex-callback',
    scope: 'logging-service:read',
    instanceId: PAN_INSTANCE_ID,
  },
  (accessToken, refreshToken, params, profile, done) => {
    // Here you can see the `accessToken`, `refreshToken`,
    // and `params.expireIn` (seconds until the accessToken expires).
    // This is a good time to store these tokens somewhere secure.
    return done(null, {})
  }
))

app.get('/cortex-activate', passport.authenticate('cortex', { session: false }))

app.get('/cortex-callback', passport.authenticate('cortex', { session: false }))
```

In this example, when a user navigates to the `/cortex-activate` endpoint, call
`passport.authenticate`. Use `{ session: false }` since this is authentication
does not represent the application user, but a connection to a datalake.

After the redirect and the user approval, Cortex will redirect back to the
callback endpoint with a `code` parameter. The verify callback
function you passed into the `CortexStrategy` constructor provides the `accessToken` and
`refreshToken` so you can do any needed verification and store the tokens
somewhere secure. Call `done(null, {})` once the tokens are stored.

The `instanceId` is passed in the `CortexStrategy` constructor. Therefore, all
`passport.authenticate()` calls will use this instance ID, unless you specify
otherwise in the call. This is an easy setup for a single tenant app for a specific datalake.

## State validation

> More secure through extra validation

While the simple example above is great to get started, you'll want to enable
state validation in production. This requires [express-session](https://www.npmjs.com/package/express-session) to
store the state between OAuth2 stages.

If you haven't already, enable sessions in Express and Passport:

```js
// This goes in your imports at the top of the file
const session = require('express-session')

// This goes somewhere in your express app setup
// Change the settings here for your app.
app.use(session({ secret: 'changeme', resave: false, saveUninitialized: true }))
app.use(passport.initialize())
app.use(passport.session())
```

Now tell the Cortex Passport strategy to validate the OAuth2 state:

```js
passport.use(new CortexStrategy(
  {
    clientID: PAN_CLIENT_ID,
    clientSecret: PAN_CLIENT_SECRET,
    callbackURL: 'https://<myserver>/cortex-callback',
    scope: 'logging-service:read',
    instanceId: PAN_INSTANCE_ID,
    state: true  // <---- add this to enable state validation.  That's it!
  },
  (accessToken, refreshToken, params, profile, done) => {
    return done(null, {})
  }
))
```

All the state validation happens under the hood. If the state is invalid,
authentication will fail.

## Multi-datalake

> Query logs from multiple datalakes

The previous examples connect to one Cortex datalake. For a multi-tenant or
multi-datalake app, you can pass the `instanceId` in at the time of
authentication. You'll also want to save this `instanceId` somewhere so when you get the
tokens, you'll know which datalake they are for. In this example, the instanceId
is saved in `req.session.datalake`, then used inside the validate callback to
associate the tokens with the datalake.

```js
passport.use(new CortexStrategy(
  {
    clientID: PAN_CLIENT_ID,
    clientSecret: PAN_CLIENT_SECRET,
    callbackURL: 'https://<myserver>/cortex-callback',
    scope: 'logging-service:read',
    state: true,
    passReqToCallback: true // <-- Add this and add `req` to the callback below
  },
  (req, accessToken, refreshToken, profile, done) => {
    // Here you can see the `accessToken`, `refreshToken`,
    // and `params.expireIn` (seconds until the accessToken expires).
    // Now you can also see `req.session.datalake` so you know which
    // datalake in the database these tokens belong to.
    // This is a good time to store these tokens in the database.
    return done(null, {})
  }
))

app.get('/cortex-activate', (req, res, next) => {
  // URL is accessed like this: /cortex-activate?datalake=20837298375297345
  // Save the datalake from the a query parameter to the session
  // Note: you should validate the datalake parameter here, too.
  req.session.datalake = req.query.datalake
  passport.authenticate('cortex', {
    session: false,
    instanceId: req.query.datalake
  })(req, res, next)
})

app.get('/cortex-callback', passport.authenticate('cortex', { session: false }))
```

This is just one way to associate the tokens with the datalake instance. You may
prefer to use another method for your app. `passport-cortex` does not prescribe
any specific way to associate the tokens to the datalake.

## Log Queries

Now that you've authenticated to Palo Alto Networks Cortex, you can make
queries. Queries are outside the scope of this `passport-cortex`, so use the
[pancloud](https://www.npmjs.com/package/pancloud) library to make the queries. Simply pass it the `refreshToken`
and `accessToken` when making queries and it will handle the query polling and
token refresh for you.
