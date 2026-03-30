# final-project-l2_group_17

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

## Order Notification Emails

This project includes Firebase Cloud Functions that queue customer email notifications whenever:

- a new order is created
- an existing order changes status

The functions do not send email directly. Instead, they add a document to a Firestore collection
named `mail`, and the Firebase Trigger Email extension sends the actual email.

### Setup

1. Install dependencies for the Cloud Functions workspace:

```sh
cd functions
npm install
```

2. Install the official Firebase Trigger Email extension for your project:

[Trigger Email extension docs](https://firebase.google.com/docs/extensions/official/firestore-send-email)

Configure the extension to watch the `mail` collection and connect it to your SMTP provider.

3. Deploy the functions:

```sh
firebase deploy --only functions
```

### What gets sent

- `onOrderCreatedSendEmail`: sends an order receipt / acknowledgement email
- `onOrderStatusChangedSendEmail`: sends a status update email when an admin changes an order
  status
