# Remix Auth Bungie Strategy

This is a [Bungie](https://bungie.net/) strategy for [remix-auth](https://github.com/sergiodxa/remix-auth) library.

This is based off of the Google Strategy from [remix-auth-socials](https://github.com/TheRealFlyingCoder/remix-auth-socials) and the Steam Strategy from [remix-auth-steam](https://github.com/Andreychik32/remix-auth-steam).

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

Bungie requires the callback to use `https://` meaning you can't use the default `http://localhost:3000` even for development. The solution that seems to have the least friction and the one I used was the free plan from [ngrok](https://ngrok.com/). You can use any solution you like, but we aware that you can't use just `http://`.

It also seems you can't use `localhost` but may need to use `127.0.0.1` or some domain setup in your hosts file. I didn't test this can not confirm either way. Using ngrok produces a domain name anyway, so if that is a limitation ngrok also solved that.

For the sake of this README I will assume that no matter the solution you use, you have a URL saved to your .env file. You will need to update your cookie to use the domain assigned to your ngrok tunnel, if you use that solution. If you have a URL in .env, you can set it to that.

### File structure

To use this package, you will need the following files or similar.

`app/services/auth.server.ts`:

```ts
import { Authenticator } from 'remix-auth';
import { sessionStorage } from '~/services/session.server';
import { BungieStrategy } from 'remix-auth-bungie';
import type { BungieProfile } from 'remix-auth-bungie';

// you can import User elsewhere to type the profile
export type User = BungieProfile;

export let authenticator = new Authenticator<User>(sessionStorage);

if (
   !process.env.BUNGIE_ID ||
   !process.env.BUNGIE_SECRET ||
   !process.env.BUNGIE_APIKEY
) {
   throw new Error('Bungie ID, Secret and API Key are required');
}

authenticator.use(
   new BungieStrategy(
      {
         clientID: process.env.BUNGIE_ID,
         clientSecret: process.env.BUNGIE_SECRET,
         callbackURL: `https://${process.env.CALLBACK_URL}/auth/callback/bungie`,
         apiKey: process.env.BUNGIE_APIKEY,
      },
      async ({ profile }) => {
         return profile;
      }
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

`app/routes/auth/bungie.tsx`:

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

         <Form action={`/auth/bungie`} method='post'>
            <button>Login to Bungie</button>
         </Form>
      </div>
   );
}
```

`app/routes/dashboard.tsx`:

```tsx
import type { LoaderFunction } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';
import { authenticator } from '~/services/auth.server';
import type { User } from '~/services/auth.server';

export let loader: LoaderFunction = async ({ request, params }) => {
   const user = await authenticator.isAuthenticated(request, {
      failureRedirect: '/login',
   });
   return user;
};

export default function Dashboard() {
   let user: User = useLoaderData();

   return (
      <>
         <h1>Dashboard</h1>
         <p>You are logged in.</p>
         <p>{user ? user.displayName : null}</p>
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
         <Form action={`/auth/bungie`} method='post'>
            <button>Bungie</button>
         </Form>
      </>
   );
}
```

Once completed, visit your app and you should be able to log in and redirected to the dashboard. If you are logged in and at the dashboard, you should see your username from Bungie. Otherwise you should be directed back to the login page.

# Contributing

Your contributions are highly appreciated! Please, submit any pull requests or issues you found!
