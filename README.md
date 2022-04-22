# Getting started

It's very easy to get started with [Slater](https://tryslater.com) and deploy your first **Next.js cron job**.

## Install Slater Vercel integration

Head to [https://vercel.com/integrations/slater](https://vercel.com/integrations/slater) and click the "Add Integration" button. Select "all projects" and follow through the signup prompts.

At the end, this will kick off an email to your email address associated with your Vercel account.

You need to "claim" your account to finalize the integration by clicking the link in your email.

## Add Slater to your Next.js app

To add your first cron job in a Next.js app, we need to make some code changes.

You'll also need to install Slater dependencies in your Next.js app.

```bash
yarn add @slaterjs/next
```

or

```bash
npm install @slaterjs/next
```

then create `pages/api/slater/[...slater].js` file with the following contents:

```js filename="[...slater].js"
const config = {
  queues: [
    {
      name: 'helloWorld',
      schedule: '0 7 * * *', // 7AM GMT
      handler: async (event, success, failure) => {
        try {
          const results = await fetch(
            'https://jsonplaceholder.typicode.com/posts/1'
          );
          const data = await results.json();
          if (results.ok) {
            return success(data);
          } else {
            return failure(data);
          }
        } catch (err) {
          return failure(err); // sends 500
        }
      },
    },
  ],
};

export default slater(config);
```

## Deploy to production

Slater only picks up production changes, so make sure you're pushing your Vercel changes all the way to produciton.
