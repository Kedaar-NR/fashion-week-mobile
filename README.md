# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

# Environment Setup for Supabase (Expo)

## 1. Add Your Supabase Anon Key

Edit your `app.json` and add your Supabase anon key under `expo.extra`:

```json
{
  "expo": {
    // ... other config ...
    "extra": {
      "SUPABASE_ANON_KEY": "your-actual-supabase-anon-key-here"
    }
  }
}
```

## 2. (Optional) Keep Your Key Out of Source Control

If you want to keep your key out of source control, use `app.config.js` and a `.env` file:

1. Install `dotenv`:
   ```sh
   npm install dotenv
   ```
2. Create a `.env` file:
   ```env
   SUPABASE_ANON_KEY=your-actual-supabase-anon-key-here
   ```
3. Create `app.config.js` in your project root:
   ```js
   import 'dotenv/config';
   export default ({ config }) => ({
     ...config,
     extra: {
       ...config.extra,
       SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
     },
   });
   ```
4. Add `.env` to your `.gitignore`:
   ```
   .env
   ```

Now your key will be injected at build time and not committed to git.

## 3. Usage in Code

The Supabase client is set up to use the key from Expo Constants:
```js
import Constants from 'expo-constants';
const extra = (Constants.expoConfig?.extra || (Constants.manifest?.extra as any) || {}) as { SUPABASE_ANON_KEY?: string };
const SUPABASE_ANON_KEY = extra.SUPABASE_ANON_KEY || '';
```
