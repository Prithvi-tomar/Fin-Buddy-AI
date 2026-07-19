import { db, auth } from "./firebase.js";

import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    deleteDoc,
    updateDoc,
    doc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
export async function saveTransaction(transaction) {

    console.log("===== SAVE START =====");
    console.log("Current User:", auth.currentUser);
    console.log("Transaction:", transaction);

    try {

         console.time("Firestore Save");

         const transactionDoc = await addDoc(
            collection(db, "transactions"),
            {
                uid: auth.currentUser.uid,
                ...transaction,
                createdAt: new Date()
            }
        );
        console.timeEnd("Firestore Save");

        console.log("Document ID:", transactionDoc.id);
        console.log("===== SAVE SUCCESS =====");

        return transactionDoc.id;

    } catch (error) {

        console.error("===== FIRESTORE ERROR =====");
        console.error(error);
        console.error(error.code);
console.error(error.message);
console.error(error.stack);

        throw error;
    }

}

export async function getUserTransactions() {

    const user = auth.currentUser;

    if (!user) {
        return [];
    }

    const transactionsQuery = query(
        collection(db, "transactions"),
        where("uid", "==", user.uid)
    );

    const snapshot = await getDocs(transactionsQuery);
    console.log("Documents found:", snapshot.size);
console.log(snapshot.docs);

    return snapshot.docs.map((transactionDoc) => ({
        id: transactionDoc.id,
        ...transactionDoc.data()
    })).sort((first, second) => {
        const firstTime = first.createdAt?.toMillis ? first.createdAt.toMillis() : 0;
        const secondTime = second.createdAt?.toMillis ? second.createdAt.toMillis() : 0;

        return secondTime - firstTime;
    });

}

export async function deleteTransactionFromFirestore(transactionId) {

    if (!transactionId) {
        return;
    }

    await deleteDoc(doc(db, "transactions", transactionId));

}
export async function updateTransactionInFirestore(transactionId, transaction) {

    if (!transactionId) {
        return;
    }

    await updateDoc(
        doc(db, "transactions", transactionId),
        {
            ...transaction
        }
    );

}
