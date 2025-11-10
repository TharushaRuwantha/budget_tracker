# OTHM Budget Calculator

A comprehensive budget calculator for the OTHM IT Degree Programme (Fast-Track Pathway - Level 4 + 5).

## Features

- **Interactive Budget Management**: Add, edit, and delete budget items in real-time
- **Financial Calculations**: Automatic calculation of revenue, expenses, profit margins, and tax
- **Profit Distribution**: Shows profit distribution between Achievers Institute (70%) and Consulting Partners (30%)
- **Visual Analytics**:
  - Profit projection by student count
  - Cost breakdown by category (pie chart)
  - Revenue vs costs comparison (bar chart)
  - Break-even analysis
- **Customizable Parameters**:
  - Adjust student count
  - Modify tuition fees
  - Change tax rate
- **Category-based Organization**: Budget items organized by OTHM Fees, Lecturer Costs, Infrastructure, Admin & Operations, and Materials & Marketing

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd budget_tracker
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to the URL shown in the terminal (typically `http://localhost:5173`)

## Build for Production

To create a production build:

```bash
npm run build
```

The built files will be in the `dist` directory.

To preview the production build:

```bash
npm run preview
```

## Technology Stack

- **React**: UI library
- **Vite**: Build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **Recharts**: Charting library for data visualization
- **Lucide React**: Icon library

## Project Structure

```
budget_tracker/
├── src/
│   ├── OTHMBudgetCalculator.jsx  # Main calculator component
│   ├── App.jsx                   # App wrapper
│   ├── main.jsx                  # Entry point
│   └── index.css                 # Global styles (Tailwind)
├── index.html                    # HTML template
├── package.json                  # Dependencies
├── vite.config.js                # Vite configuration
├── tailwind.config.js            # Tailwind configuration
└── postcss.config.js             # PostCSS configuration
```

## Usage

1. **Adjust Parameters**: Use the Programme Parameters section to change student count, tuition fees, and tax rate
2. **Manage Budget Items**:
   - Click the "Add New Item" button to add custom budget items
   - Click the edit icon to modify existing items
   - Click the delete icon to remove items
3. **View Analytics**: Scroll down to see various charts and financial summaries
4. **Break-even Analysis**: See how many students are needed to break even

## Default Configuration

- Student Count: 30
- Tuition Fee per Student: LKR 450,000 (2-year programme)
- Tax Rate: 30%
- Programme Duration: 24 months (2 years)
- Region: Region 3 Pricing (Sri Lanka)

## License

MIT
