# 🤖 Comparing the AI 🧠

Welcome to the **Comparing the AI** project! This repository contains a web-based application designed to compare the performance and code generation capabilities of various leading AI models, including Google's Gemini and OpenAI's GPT series.

---

### 🌟 Project Overview

This tool provides a user-friendly interface to send the same prompt to multiple AI models simultaneously and view their responses side-by-side. It serves as a practical way to evaluate and contrast the outputs of different models for tasks like code generation, problem-solving, and general text creation.

The application is built with a modern web stack and is designed to be both functional and easy to use.

---

### ✨ Key Features

* **Side-by-Side Comparison:** Enter a single prompt and receive responses from both Gemini and GPT models in a clean, comparable format.
* **Code Highlighting:** Generated code snippets are automatically highlighted with correct syntax, making them easy to read and evaluate.
* **Web Interface:** A simple and intuitive UI built with modern web technologies for a smooth user experience.
* **API Integration:** Connects to the backend APIs of both Google and OpenAI to fetch real-time responses.

---

### 💻 Technologies Used

This project is built using the MERN stack and other modern web technologies:

* **Frontend:**
    * **React:** For building the user interface.
    * **Tailwind CSS:** For styling the application.
* **Backend:**
    * **Node.js & Express:** For the server-side logic and API routing.
* **API:**
    * **Google Gemini API:** To get responses from the Gemini model.
    * **OpenAI API:** To get responses from the GPT models.

---

### ⚙️ How to Set Up and Run

To run this project locally, you will need to have Node.js and npm installed.

1.  **Clone the Repository:**
    ```bash
    git clone [https://github.com/ranveersingh18w/Comparingtheai.git](https://github.com/ranveersingh18w/Comparingtheai.git)
    cd Comparingtheai
    
2.  **Install Dependencies:**
    You'll need to install the necessary packages for both the client (frontend) and the server (backend).
    ```bash
    # Install server dependencies
    cd server
    npm install

    # Install client dependencies
    cd ../client
    npm install
    
3.  **Set Up Environment Variables:**
    Create a `.env` file in the `server` directory and add your API keys.
    ```env
    GOOGLE_API_KEY=YOUR_GOOGLE_API_KEY
    OPENAI_API_KEY=YOUR_OPENAI_API_KEY
    
4.  **Run the Application:**
    You can start both the frontend and backend servers concurrently.
    ```bash
    # From the root directory
    # Run the backend server
    cd server && npm start

    # Open a new terminal and run the frontend client
    cd client && npm start
    
The application should now be running on your local machine!

---

Thank you for checking out this project!
