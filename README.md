# FinBuddy AI

FinBuddy AI is a personal finance dashboard that uses Firebase Authentication and Firestore to help users track income, expenses, balance, and financial activity.

## Current Features

- Landing page with login/signup navigation
- Firebase email/password signup and login
- Protected dashboard route
- User-specific Firestore transactions
- Add, edit, and delete transactions
- Income, expense, and balance summary cards
- Chart.js dashboard charts
- Responsive login, signup, and dashboard layouts
- Logout flow

## Run Locally

Use a local HTTP server because the app uses ES modules.

```bash
node -e "const http=require('http'),fs=require('fs'),path=require('path');const root=process.cwd();const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml'};http.createServer((req,res)=>{let p=decodeURIComponent(req.url.split('?')[0]);if(p==='/' )p='/index.html';const file=path.join(root,p);if(!file.startsWith(root)){res.writeHead(403);return res.end('Forbidden');}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);return res.end('Not found');}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(data);});}).listen(8000,()=>console.log('Server running at http://localhost:8000/'));"
```

Open:

```text
http://localhost:8000/
```

## Firebase Setup

1. Enable Email/Password authentication in Firebase Authentication.
2. Create a Firestore database.
3. Use Firestore security rules that only allow users to read and write their own transactions.

Example rules:

```text
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /transactions/{transactionId} {
      allow read, update, delete: if request.auth != null
        && request.auth.uid == resource.data.uid;
      allow create: if request.auth != null
        && request.auth.uid == request.resource.data.uid;
    }
  }
}
```

## Completion Checklist

1. Replace placeholder landing content with final copy and visuals.
2. Add budget creation and monthly budget tracking.
3. Add transaction filters by date, category, and type.
4. Add Firestore update support instead of delete-and-create for edits.
5. Build real AI insights using selected transaction totals and categories.
6. Add form validation messages below inputs.
7. Add loading and empty states for the dashboard.
8. Test Firebase rules with two different users.
9. Deploy to Firebase Hosting, Netlify, or Vercel.

## Useful Checks

```bash
node --check js/auth.js
node --check js/dashboard.js
node --check js/firestore.js
```
