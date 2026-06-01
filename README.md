# Golden Design Saunas Chatbot

[LIVE DEMO](https://jonssonrickard.github.io/golden-design-saunas/)

This project is a customer support chatbot for Golden Design Saunas, built with JavaScript, Node.js, Express and the OpenAI API.

The chatbot uses RAG, chunks, embeddings and a local vector store to retrieve relevant information from the knowledge base before answering customer questions.

## Main files

- `server.js` - backend server and chatbot logic
- `createEmbeddings.js` - creates chunks, embeddings and vector store
- `vectorStore.json` - local vector database
- `golden_design_knowledge_base.md` - general knowledge base
- `golden_design_product_catalogue.md` - product catalogue
- `index.html` - public chatbot test page

## Technologies

- JavaScript
- Node.js
- Express
- OpenAI API
- RAG
- Embeddings
- Vector Store
- HTML/CSS