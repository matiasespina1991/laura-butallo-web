This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
```

## Deploy Cloud Functions

Use command:

```bash
npm run deploy-functions
```

Or if you want to do it manually:

From /functions/:

```bash
rm -rf lib
npx tsc
```

This command above will compile the TS functions into JS.

Then run:

```bash
rm -rf lib
npx tsc
```

If you get an error similar to this one:

```bash
Build failed with status: FAILURE and message: npm error code EUSAGE
npm error
npm error `npm ci` can only install packages when your package.json and package-lock.json or npm-shrinkwrap.json are in sync. Please update your lock file with `npm install` before continuing.
npm error
npm error Missing: jest@30.2.0 from lock file
```

- Multilanguage

- Menu de obras y exhibiciones como aparece acá:
  https://lucianaflorio.com/Artworks-1
