# Mock API & Postman Collection Generator

## 📌 Overview
This application allows users to **generate, manage, and test mock APIs**, while also providing the ability to **import/export Postman collections**. It features:
- **Mock API creation** with real-time testing.
- **API Discovery**: Automatically detects endpoints from a given API URL.
- **Postman Collection Import & Export**.
- **DTO, POCO, BO, and DAO generation**.
- **Neon UI design for an enhanced developer experience**.
- **Multi-language DTO generation** (TS, Java, Dart, Go, etc.).
- **Support for downloading API data models as ZIP files**.

## 🚀 Features
### ✅ Mock API Creation
- Easily create and publish APIs with **mock endpoints**.
- View API status, connections, and public URLs.

### ✅ API Discovery & Collection Generation
- Provide an API URL, and the app **automatically generates a Postman collection**.
- Extracts **endpoints, headers, and responses**.
- Example:
  - `GET https://catfact.ninja/fact` → **Generates a Postman collection** with request & response structure.

### ✅ Postman Collection Import & Fixes
- Import **Postman v2.x collections**.
- **Cleans environment variables** while maintaining request integrity.
- **Fixes collection import issues** (ensuring correct parsing and validation).

### ✅ DTO, POCO, BO, DAO Generation
- Supports **DTO (Data Transfer Objects)** for multiple programming languages:
  - TypeScript, Java, Dart, Go, Python, etc.
- Business Objects (BO), Data Access Objects (DAO), and POCOs are also generated.
- Users can **select which DTOs to generate** before downloading.

### ✅ UI & Design Enhancements
- **Neon-themed UI** for an improved development experience.
- Displays **API publishing status, incoming connections, and public URLs**.

## 🛠️ Installation & Setup
### Prerequisites
Ensure you have the following installed:
- **Node.js** (Latest LTS version recommended)
- **npm or yarn**

### Setup Instructions
1. Clone the repository:
   ```sh
   git clone https://github.com/your-repo/mock-api-generator.git
   cd mock-api-generator
   ```
2. Install dependencies:
   ```sh
   npm install  # or yarn install
   ```
3. Start the development server:
   ```sh
   npm run dev  # or yarn dev
   ```
4. Open `http://localhost:3000` in your browser.

## 🖥️ Usage
### Create a Mock API
1. Go to the **Mock API** section.
2. Define your endpoints (method, request body, headers, response data).
3. Click **Publish** and test your API.

### Generate a Postman Collection from API Response
1. Provide an API URL.
2. The app **automatically extracts endpoints** and generates a collection.
3. Export the collection to **Postman**.

### Import a Postman Collection
1. Upload a Postman collection file (`.json`).
2. The app will **clean variables and parse endpoints correctly**.
3. Generate **DTOs and mock APIs** from the imported data.

### Generate DTOs, POCOs, BOs, and DAOs
1. Select the **API or Postman collection**.
2. Choose the languages for DTO generation.
3. Download the generated **data models as a ZIP file**.

## 📌 Roadmap & Future Improvements
- ✅ **Fix Postman import issues** (completed ✅)
- 🚀 **Add OpenAPI/Swagger import support**
- 🔥 **Support XML/YAML responses** for DTO generation
- 📡 **Enable public mock API hosting**

## 🛠️ Tech Stack
- **Frontend:** React + TailwindCSS
- **Testing:** Jest + React Testing Library (TDD approach)

## 🤝 Contributing
1. Fork the repository.
2. Create a new branch: `git checkout -b feature-name`.
3. Commit your changes: `git commit -m 'Added feature XYZ'`.
4. Push to the branch: `git push origin feature-name`.
5. Submit a **Pull Request**.

## 📜 License
MIT License. Feel free to modify and use it for your projects!

---
🚀 **Ready to build your mock APIs and Postman collections effortlessly? Start now!**

