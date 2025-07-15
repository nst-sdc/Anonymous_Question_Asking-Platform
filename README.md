# **Anonymous Question Asking Platform**

---

### 🧠 **Project Overview**

The **Anonymous Question Asking Platform** is a real-time, web-based application that facilitates anonymous interactions between students and teachers. Designed primarily for educational settings, the platform ensures that students can express doubts or feedback without fear of judgment, while giving teachers moderation tools to manage and maintain a respectful environment.

---

### 🎯 **Objectives**

* Encourage anonymous student-teacher interaction to promote honest and open communication.
* Provide teachers with control mechanisms to maintain discipline.
* Prevent misuse through abuse filters and moderation tools.

---

### 🏗️ **Core Features**

#### 👥 **User Roles**

1. **Students**
2. **Teachers**

---

### 🔐 **Authentication System**

* **Role-Based Login**: Separate login portals for students and teachers.
* **Anonymous Identity**: Upon login, each student is assigned a **randomly generated anonymous username**.
* **Secure Sessions**: Authentication tokens to ensure secure access.

---

### 🧑‍🎓 **Student Functionalities**

* **Anonymous Chat Participation**

  * Join chat rooms using a **unique room code**.
  * Communicate anonymously with teachers and peers.
  * **Profanity Filter**: All messages are screened for abusive content and blocked if detected.

* **Engagement Tools**

  * **Poll Participation**: Students can vote in real-time polls created by the teacher.
  * **Reactions**: Send emoji-based reactions to messages or announcements.

---

### 👩‍🏫 **Teacher Functionalities**

* **Room Management**

  * Create a chat room with a **unique access code**.
  * Share the code with students to allow entry.

* **Moderation Tools**

  * **Silencing Students**: Temporarily mute any student for the following durations:

    * 10 minutes
    * 20 minutes
    * 30 minutes
    * 1 hour
    * 24 hours
  * **Permanent Ban Rule**: If a student is silenced **4 times for 20 minutes or more**, they are automatically **permanently banned** from the platform.

---

### 🛡️ **Content Moderation & Abuse Prevention**

* **Profanity Detection**: Messages are filtered through a predefined list of abusive or inappropriate words.
* **Logging Violations**: Each incident (e.g., being silenced or sending flagged content) is recorded.
* **Ban Enforcement**: Upon hitting the violation threshold, the system auto-enforces a ban.

---

### 🚀 Getting Started

Follow these instructions to get the project up and running on your local machine.

#### **Prerequisites**

*   Node.js and npm (or yarn)
*   A Supabase account

#### **1. Clone the Repository**

```bash
git clone <repository-url>
cd Anonymous_Question_Asking-Platform
```

#### **2. Setup Backend**

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Create a `.env` file by copying the example file:
    ```bash
    cp .env.example .env
    ```

4.  Get your Supabase credentials:
    *   Go to your Supabase project dashboard.
    *   Navigate to **Project Settings** > **API**.
    *   Find your **Project URL** and **Service Role Key**.

5.  Update the `.env` file with your credentials:
    ```
    SUPABASE_URL=your_supabase_project_url
    SUPABASE_SERVICE_KEY=your_supabase_service_role_key
    ```

6.  Start the backend server:
    ```bash
    npm start
    ```

#### **3. Setup Frontend**

1.  Navigate to the `frontend` directory from the root:
    ```bash
    cd ../frontend
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Create a `.env` file:
    ```bash
    cp .env.example .env
    ```

4.  Get your Supabase credentials:
    *   Go to your Supabase project dashboard.
    *   Navigate to **Project Settings** > **API**.
    *   Find your **Project URL** and **anon Public Key**.

5.  Update the `.env` file with your credentials:
    ```
    VITE_SUPABASE_URL=your_supabase_project_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_public_key
    ```

6.  Start the frontend development server:
    ```bash
    npm run dev
    ```

---

### 🔧 **Technical Architecture** (Optional - If applicable)

* **Frontend**: React.js
* **Backend**: Node.js + Express / Django (TBD)
* **Database**: MongoDB / PostgreSQL (TBD)
* **Authentication**: JWT / Firebase Auth
* **Deployment**: Vercel / Netlify (frontend), Railway / Heroku / Render (backend)

---

### 🚀 **Future Enhancements**

* Real-time Q\&A summary for teachers.
* Anonymous voting for “most helpful” student questions.
* Role-based analytics dashboard.
* Integration with Google Classroom or Microsoft Teams.

---

### 📌 Conclusion

The **Anonymous Question Asking Platform** serves as a bridge for safer, transparent, and moderated academic interaction. By offering anonymity to students and control to teachers, it promotes active participation, curiosity, and learning — all while maintaining discipline and respect in digital classrooms.
