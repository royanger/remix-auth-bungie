# Remix Auth Bungie Strategy

This is a [Bungie](https://bungie.net/) strategy for [remix-auth](https://github.com/sergiodxa/remix-auth) library.

This is based off of the Google Strategy from [remix-auth-socials](https://github.com/TheRealFlyingCoder/remix-auth-socials)

## Supported runtimes

| Runtime    | Has Support |
| ---------- | ----------- |
| Node.js    | ✅          |
| Cloudflare | Not tested  |

## How to use

### Installation

Please, use

```bash
npm i remix-auth-bungie
```

or

```bash
yarn add remix-auth-bungie
```

### Local Development - READ THIS

Bungie requires the callback to use `https://` meaning you can't use the default `http://localhost:3000` even for development. The solution that seems to have the least friction and the one I used was the free plan from [ngrok](https://ngrok.com/). You can use any solution you like, but we aware that you can't use just `http://` For the sake of this tutorial I will assume that no matter the solution you use, you have a URL saved to your .env file.

You will need to update your cookie to use the domain assigned to your ngrok tunnel, if you use that solution. If you have a URL in .env, you can set it to that.

### File structure

To use this package, you will need the following files or similar.

`app/services/auth.server.ts`:

```ts
import { Authenticator } from 'remix-auth';
import { sessionStorage } from '~/services/session.server';
import { BungieStrategy } from 'remix-auth-bungie';

export type User = SteamStrategyVerifyParams;

export let authenticator = new Authenticator<User>(sessionStorage);

if (!process.env.BUNGIE_ID || !process.env.BUNGIE_SECRET) {
   throw new Error('GitHub ID and Secret required');
}

authenticator.use(
   new BungieStrategy(
      {
         callbackURL: `https://${process.env.URL}/auth/callback/bungie`,
         clientID: process.env.BUNGIE_ID,
         clientSecret: process.env.BUNGIE_SECRET,
      },
      async (user) => user // perform additional checks for user here
   )
);
```

`app/services/session.server.ts`:

```ts
import { createCookieSessionStorage } from '@remix-run/node';

export let sessionStorage = createCookieSessionStorage({
   cookie: {
      name: 'choose-your-name',
      sameSite: 'lax',
      domain: process.env.URL,
      path: '/',
      httpOnly: true,
      secrets: ['process.env.SECRET'],
      secure: process.env.NODE_ENV === 'production',
   },
});

export let { getSession, commitSession, destroySession } = sessionStorage;
```

`app/routes/auth/steam.tsx`:

```tsx
import type { ActionFunction, LoaderFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { authenticator } from '~/services/auth.server';

export let loader: LoaderFunction = () => redirect('/login');

export let action: ActionFunction = ({ request, params }) => {
   return authenticator.authenticate('bungie', request, {
      successRedirect: '/dashboard',
      failureRedirect: '/login',
   });
};
```

`app/routes/auth/callback/bungie.tsx`:

```tsx
import type { LoaderFunction } from '@remix-run/node';
import { authenticator } from '~/services/auth.server';

export let loader: LoaderFunction = ({ request, params }) => {
   return authenticator.authenticate('bungie', request, {
      successRedirect: '/dashboard',
      failureRedirect: '/login',
   });
};
```

### Utilization

Here is an example of setting up your app based on the above settings.

`app/routes/index.tsx`:

```tsx
import { Form } from '@remix-run/react';

export default function Index() {
   return (
      <div style={{ fontFamily: 'system-ui, sans-serif', lineHeight: '1.4' }}>
         <h1>Welcome to Remix</h1>
         <p>
            <Form action={`/auth/bungie`} method='post'>
               <button>Login to Bungie</button>
            </Form>
         </p>
      </div>
   );
}
```

`app/routes/dashboard.tsx`:

```tsx
import type { LoaderFunction } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';
import { authenticator } from '~/services/auth.server';

export let loader: LoaderFunction = async ({ request, params }) => {
   const user = await authenticator.isAuthenticated(request, {
      failureRedirect: '/',
   });
   console.log('loader', user);

   return { user };
};

export default function Dashboard() {
   let { user } = useLoaderData();

   console.log(user);

   return (
      <>
         <h1>Dashboard</h1>
         <p>You are logged in.</p>
         <p>{user ? user.name : null}</p>
         <Form method='post' action='/auth/logout'>
            <button>Logout</button>
         </Form>
      </>
   );
}
```

`app/routes/login.tsx`:

```tsx
import { Form } from '@remix-run/react';

export default function Login() {
   return (
      <>
         <h1>Login</h1>
         <Form action={`/auth/github`} method='post'>
            <button>GitHub</button>
         </Form>
      </>
   );
}
```

Once completed, visit your app and you should be able to log in and redirected to the dashboard. If you are logged in and at the dashboard, you should see your username from Bungie. Otherwise you should be directed back to the login page.

# Contributing

Your contributions are highly appreciated! Please, submit any pull requests or issues you found!
