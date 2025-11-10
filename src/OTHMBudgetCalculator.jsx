import React, { useState, useMemo, useRef } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Plus, Trash2, Edit2, Save, X, DollarSign, TrendingUp, Users, Calculator, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const OTHMBudgetCalculator = () => {
  // Student count and tuition fee
  const [studentCount, setStudentCount] = useState(30);
  const [tuitionFeePerStudent, setTuitionFeePerStudent] = useState(450000); // LKR for 2-year program (as per proposal)

  // Refs for chart elements to capture in PDF
  const lineChartRef = useRef(null);
  const pieChartRef = useRef(null);
  const barChartRef = useRef(null);
  const breakEvenRef = useRef(null);

  // Budget items from the proposal document - ALL EDITABLE AND DELETABLE
  const [budgetItems, setBudgetItems] = useState([
    // OTHM Fees
    { id: 1, name: 'OTHM Centre Approval (One-time, 5 years)', amount: 152000, type: 'fixed', category: 'OTHM Fees' },
    { id: 2, name: 'Student Registration (Level 4 + Level 5)', amount: 3600000, type: 'variable', category: 'OTHM Fees', formula: '30 × (£150 + £150) × 400' },
    { id: 3, name: 'EQA Fees (2 years)', amount: 360000, type: 'variable', category: 'OTHM Fees', formula: '£450 × 2 years × 400' },

    // Lecturer Costs
    { id: 4, name: 'Teaching Staff', amount: 2880000, type: 'fixed', category: 'Lecturer Costs', formula: '480h × 2 × 3000' },

    // Infrastructure
    { id: 5, name: 'Hall/Classroom Rent (24 months)', amount: 720000, type: 'fixed', category: 'Infrastructure' },
    { id: 6, name: 'Microsoft Student Account', amount: 480000, type: 'variable', category: 'Infrastructure', formula: '40 × 400 × 2' },

    // Admin & Operations
    { id: 7, name: 'Programme Coordinator (24 months)', amount: 600000, type: 'fixed', category: 'Admin & Operations' },
    { id: 8, name: 'Admin Support Staff (24 months)', amount: 720000, type: 'fixed', category: 'Admin & Operations' },

    // Materials & Marketing
    { id: 9, name: 'Printing & Materials (30 students × 2 years)', amount: 150000, type: 'variable', category: 'Materials & Marketing' },
    { id: 10, name: 'Marketing & Promotion (3% of revenue)', amount: 405000, type: 'variable', category: 'Materials & Marketing', formula: '3% of revenue' },
    { id: 11, name: 'Utilities & Miscellaneous (24 months)', amount: 240000, type: 'fixed', category: 'Materials & Marketing' },
  ]);

  const [editingItem, setEditingItem] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, item: null });
  const [newItemForm, setNewItemForm] = useState({ show: false, name: '', amount: '', type: 'fixed', category: 'OTHM Fees' });
  const [taxRate, setTaxRate] = useState(30); // 30% tax rate as per proposal

  // Calculate totals
  const calculations = useMemo(() => {
    const totalRevenue = tuitionFeePerStudent * studentCount;
    const totalExpenses = budgetItems.reduce((sum, item) => sum + item.amount, 0);
    const netProfitBeforeTax = totalRevenue - totalExpenses;
    const tax = (netProfitBeforeTax * taxRate) / 100;
    const netProfitAfterTax = netProfitBeforeTax - tax;
    const profitMargin = (netProfitAfterTax / totalRevenue * 100);

    // Profit distribution
    const achieversShare = netProfitAfterTax * 0.70;
    const consultingShare = netProfitAfterTax * 0.30;
    const partner1Share = consultingShare * 0.50; // 15% of total (50% of 30%)
    const partner2Share = consultingShare * 0.50; // 15% of total (50% of 30%)

    // Category breakdown
    const categoryTotals = {};
    budgetItems.forEach(item => {
      categoryTotals[item.category] = (categoryTotals[item.category] || 0) + item.amount;
    });

    return {
      totalRevenue,
      totalExpenses,
      netProfitBeforeTax,
      tax,
      netProfitAfterTax,
      profitMargin,
      achieversShare,
      consultingShare,
      partner1Share,
      partner2Share,
      categoryTotals,
      costPerStudent: totalExpenses / studentCount,
    };
  }, [budgetItems, studentCount, tuitionFeePerStudent, taxRate]);

  // Generate projection data
  const projectionData = useMemo(() => {
    const data = [];
    for (let students = 10; students <= 100; students += 5) {
      const revenue = tuitionFeePerStudent * students;
      const expenses = budgetItems.reduce((sum, item) => sum + item.amount, 0);
      const profitBeforeTax = revenue - expenses;
      const taxAmount = (profitBeforeTax * taxRate) / 100;
      const profitAfterTax = profitBeforeTax - taxAmount;

      data.push({
        students,
        revenue: revenue / 1000000,
        expenses: expenses / 1000000,
        profitBeforeTax: profitBeforeTax / 1000000,
        profitAfterTax: profitAfterTax / 1000000,
      });
    }
    return data;
  }, [budgetItems, tuitionFeePerStudent, taxRate]);

  // Category breakdown for pie chart
  const categoryBreakdown = useMemo(() => {
    return Object.entries(calculations.categoryTotals).map(([name, value]) => ({
      name,
      value: value / 1000000
    }));
  }, [calculations.categoryTotals]);

  const handleEdit = (item) => {
    setEditingItem({ ...item });
  };

  const handleSaveEdit = () => {
    setBudgetItems(budgetItems.map(item =>
      item.id === editingItem.id ? editingItem : item
    ));
    setEditingItem(null);
  };

  const handleDelete = (id) => {
    setDeleteConfirm({ show: true, item: id });
  };

  const confirmDelete = () => {
    setBudgetItems(budgetItems.filter(item => item.id !== deleteConfirm.item));
    setDeleteConfirm({ show: false, item: null });
  };

  const cancelDelete = () => {
    setDeleteConfirm({ show: false, item: null });
  };

  const handleAddItem = () => {
    const newItem = {
      id: Date.now(),
      name: newItemForm.name,
      amount: parseFloat(newItemForm.amount),
      type: newItemForm.type,
      category: newItemForm.category,
    };
    setBudgetItems([...budgetItems, newItem]);
    setNewItemForm({ show: false, name: '', amount: '', type: 'fixed', category: 'OTHM Fees' });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // PDF Generation Function
  const generatePDF = async () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;

    // Helper function to add new page if needed
    const checkPageBreak = (requiredSpace) => {
      if (yPosition + requiredSpace > pageHeight - 20) {
        pdf.addPage();
        yPosition = 20;
        return true;
      }
      return false;
    };

    // Header
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('OTHM IT Degree Programme', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Budget Calculator - Fast-Track Pathway (Level 4 + 5)', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 6;
    pdf.setFontSize(10);
    pdf.text('Duration: 24 months | Region 3 Pricing (Sri Lanka)', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 12;

    // Key Metrics
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Key Metrics', 15, yPosition);
    yPosition += 8;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const metrics = [
      ['Total Students:', studentCount.toString()],
      ['Total Revenue:', formatCurrency(calculations.totalRevenue)],
      ['Total Expenses:', formatCurrency(calculations.totalExpenses)],
      ['Net Profit (After Tax):', formatCurrency(calculations.netProfitAfterTax)],
      ['Profit Margin:', `${calculations.profitMargin.toFixed(2)}%`],
    ];

    metrics.forEach(([label, value]) => {
      pdf.text(label, 15, yPosition);
      pdf.text(value, pageWidth - 15, yPosition, { align: 'right' });
      yPosition += 6;
    });
    yPosition += 6;

    // Budget Items Table
    checkPageBreak(50);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Budget Items by Category', 15, yPosition);
    yPosition += 8;

    pdf.setFontSize(9);
    Object.entries(groupedItems).forEach(([category, items]) => {
      checkPageBreak(20 + items.length * 6);

      pdf.setFont('helvetica', 'bold');
      pdf.text(category, 15, yPosition);
      yPosition += 6;

      pdf.setFont('helvetica', 'normal');
      items.forEach(item => {
        const itemText = `${item.name} (${item.type})`;
        pdf.text(itemText, 20, yPosition, { maxWidth: pageWidth - 75 });
        pdf.text(formatCurrency(item.amount), pageWidth - 15, yPosition, { align: 'right' });
        yPosition += 5;
      });

      pdf.setFont('helvetica', 'bold');
      pdf.text('Subtotal:', pageWidth - 70, yPosition);
      pdf.text(formatCurrency(calculations.categoryTotals[category] || 0), pageWidth - 15, yPosition, { align: 'right' });
      yPosition += 8;
    });

    pdf.setFontSize(11);
    pdf.text('TOTAL EXPENSES:', pageWidth - 80, yPosition);
    pdf.text(formatCurrency(calculations.totalExpenses), pageWidth - 15, yPosition, { align: 'right' });
    yPosition += 12;

    // Financial Summary
    checkPageBreak(60);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Financial Summary', 15, yPosition);
    yPosition += 8;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const financialData = [
      ['Total Revenue:', formatCurrency(calculations.totalRevenue)],
      ['Total Expenses:', formatCurrency(calculations.totalExpenses)],
      ['Net Profit (Before Tax):', formatCurrency(calculations.netProfitBeforeTax)],
      [`Tax (${taxRate}%):`, formatCurrency(calculations.tax)],
      ['Net Profit (After Tax):', formatCurrency(calculations.netProfitAfterTax)],
    ];

    financialData.forEach(([label, value]) => {
      pdf.text(label, 15, yPosition);
      pdf.text(value, pageWidth - 15, yPosition, { align: 'right' });
      yPosition += 6;
    });
    yPosition += 8;

    // Profit Distribution
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Profit Distribution', 15, yPosition);
    yPosition += 6;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const profitDist = [
      ['Achievers Institute (70%):', formatCurrency(calculations.achieversShare)],
      ['Consulting Team Total (30%):', formatCurrency(calculations.consultingShare)],
      ['  → Partner 1 (15%):', formatCurrency(calculations.partner1Share)],
      ['  → Partner 2 (15%):', formatCurrency(calculations.partner2Share)],
    ];

    profitDist.forEach(([label, value]) => {
      pdf.text(label, 20, yPosition);
      pdf.text(value, pageWidth - 15, yPosition, { align: 'right' });
      yPosition += 6;
    });
    yPosition += 10;

    // Capture and add charts
    pdf.addPage();
    yPosition = 20;
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Visual Analysis', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    // Capture Line Chart
    if (lineChartRef.current) {
      try {
        const canvas = await html2canvas(lineChartRef.current, { scale: 2, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - 30;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        checkPageBreak(imgHeight + 15);
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Profit Projection by Student Count', 15, yPosition);
        yPosition += 6;
        pdf.addImage(imgData, 'PNG', 15, yPosition, imgWidth, imgHeight);
        yPosition += imgHeight + 10;
      } catch (error) {
        console.error('Error capturing line chart:', error);
      }
    }

    // Capture Pie Chart
    if (pieChartRef.current) {
      try {
        checkPageBreak(90);
        const canvas = await html2canvas(pieChartRef.current, { scale: 2, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - 30;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Cost Breakdown by Category', 15, yPosition);
        yPosition += 6;
        pdf.addImage(imgData, 'PNG', 15, yPosition, imgWidth, imgHeight);
        yPosition += imgHeight + 10;
      } catch (error) {
        console.error('Error capturing pie chart:', error);
      }
    }

    // Capture Bar Chart
    if (barChartRef.current) {
      try {
        checkPageBreak(90);
        const canvas = await html2canvas(barChartRef.current, { scale: 2, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - 30;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (yPosition + imgHeight > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Revenue vs Costs Analysis', 15, yPosition);
        yPosition += 6;
        pdf.addImage(imgData, 'PNG', 15, yPosition, imgWidth, imgHeight);
        yPosition += imgHeight + 10;
      } catch (error) {
        console.error('Error capturing bar chart:', error);
      }
    }

    // Capture Break-even Analysis
    if (breakEvenRef.current) {
      try {
        checkPageBreak(70);
        const canvas = await html2canvas(breakEvenRef.current, { scale: 2, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - 30;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Break-even Analysis', 15, yPosition);
        yPosition += 6;
        pdf.addImage(imgData, 'PNG', 15, yPosition, imgWidth, imgHeight);
      } catch (error) {
        console.error('Error capturing break-even chart:', error);
      }
    }

    // Save PDF
    pdf.save(`OTHM-Budget-Calculator-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  // Group items by category
  const groupedItems = useMemo(() => {
    const grouped = {};
    budgetItems.forEach(item => {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    });
    return grouped;
  }, [budgetItems]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Delete Confirmation Modal */}
        {deleteConfirm.show && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md mx-4">
              <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 text-center mb-2">Delete Item?</h3>
              <p className="text-gray-600 text-center mb-6">
                Are you sure you want to delete this budget item? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">OTHM IT Degree Programme</h1>
              <p className="text-xl text-gray-600">Budget Calculator - Fast-Track Pathway (Level 4 + 5)</p>
              <div className="mt-4 flex gap-4 text-sm text-gray-500">
                <span>Duration: 24 months (2 years)</span>
                <span>•</span>
                <span>Region 3 Pricing (Sri Lanka)</span>
              </div>
            </div>
            <button
              onClick={generatePDF}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Download className="w-5 h-5" />
              <span className="font-semibold">Download PDF</span>
            </button>
          </div>
        </div>

        {/* Key Metrics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{studentCount}</span>
            </div>
            <p className="text-blue-100 text-sm">Total Students</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 opacity-80" />
              <span className="text-xl font-bold">{formatCurrency(calculations.totalRevenue)}</span>
            </div>
            <p className="text-green-100 text-sm">Total Revenue</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Calculator className="w-8 h-8 opacity-80" />
              <span className="text-xl font-bold">{formatCurrency(calculations.totalExpenses)}</span>
            </div>
            <p className="text-orange-100 text-sm">Total Expenses</p>
          </div>

          <div className={`bg-gradient-to-br ${calculations.netProfitAfterTax >= 0 ? 'from-emerald-500 to-emerald-600' : 'from-red-500 to-red-600'} rounded-xl shadow-lg p-6 text-white`}>
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 opacity-80" />
              <span className="text-xl font-bold">{formatCurrency(calculations.netProfitAfterTax)}</span>
            </div>
            <p className={`text-sm ${calculations.netProfitAfterTax >= 0 ? 'text-emerald-100' : 'text-red-100'}`}>
              Net Profit ({calculations.profitMargin.toFixed(1)}%)
            </p>
          </div>
        </div>

        {/* Programme Parameters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Programme Parameters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Students
              </label>
              <input
                type="number"
                value={studentCount}
                onChange={(e) => setStudentCount(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tuition Fee per Student (2-year programme)
              </label>
              <input
                type="number"
                value={tuitionFeePerStudent}
                onChange={(e) => setTuitionFeePerStudent(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
              />
              <p className="text-xs text-gray-500 mt-1">{formatCurrency(tuitionFeePerStudent)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tax Rate (%)
              </label>
              <input
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                max="100"
                step="0.1"
              />
            </div>
          </div>
        </div>

        {/* Budget Items by Category */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Budget Items (All Editable & Deletable)</h2>
            <button
              onClick={() => setNewItemForm({ ...newItemForm, show: true })}
              className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
            >
              <Plus className="w-4 h-4" /> Add New Item
            </button>
          </div>

          {/* Add New Item Form */}
          {newItemForm.show && (
            <div className="mb-6 p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
              <h3 className="font-semibold text-gray-800 mb-3">Add New Budget Item</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="Item name"
                  value={newItemForm.name}
                  onChange={(e) => setNewItemForm({...newItemForm, name: e.target.value})}
                  className="px-3 py-2 border rounded-lg"
                />
                <input
                  type="number"
                  placeholder="Amount (LKR)"
                  value={newItemForm.amount}
                  onChange={(e) => setNewItemForm({...newItemForm, amount: e.target.value})}
                  className="px-3 py-2 border rounded-lg"
                />
                <select
                  value={newItemForm.type}
                  onChange={(e) => setNewItemForm({...newItemForm, type: e.target.value})}
                  className="px-3 py-2 border rounded-lg"
                >
                  <option value="fixed">Fixed Cost</option>
                  <option value="variable">Variable Cost</option>
                </select>
                <select
                  value={newItemForm.category}
                  onChange={(e) => setNewItemForm({...newItemForm, category: e.target.value})}
                  className="px-3 py-2 border rounded-lg"
                >
                  <option value="OTHM Fees">OTHM Fees</option>
                  <option value="Lecturer Costs">Lecturer Costs</option>
                  <option value="Infrastructure">Infrastructure</option>
                  <option value="Admin & Operations">Admin & Operations</option>
                  <option value="Materials & Marketing">Materials & Marketing</option>
                </select>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleAddItem}
                  disabled={!newItemForm.name || !newItemForm.amount}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4 inline mr-1" /> Save Item
                </button>
                <button
                  onClick={() => setNewItemForm({ show: false, name: '', amount: '', type: 'fixed', category: 'OTHM Fees' })}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                >
                  <X className="w-4 h-4 inline mr-1" /> Cancel
                </button>
              </div>
            </div>
          )}

          {/* Budget Items Table by Category */}
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} className="mb-6">
              <h3 className="text-lg font-bold text-gray-700 bg-gray-50 px-4 py-2 rounded-t-lg border-b-2 border-gray-300">
                {category}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Item</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Type</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Amount (LKR)</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          {editingItem?.id === item.id ? (
                            <input
                              type="text"
                              value={editingItem.name}
                              onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                              className="w-full px-2 py-1 border rounded"
                            />
                          ) : (
                            <div>
                              <span className="text-gray-800 font-medium">{item.name}</span>
                              {item.formula && (
                                <span className="text-xs text-gray-500 block mt-1">Formula: {item.formula}</span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {editingItem?.id === item.id ? (
                            <select
                              value={editingItem.type}
                              onChange={(e) => setEditingItem({...editingItem, type: e.target.value})}
                              className="px-2 py-1 border rounded text-sm"
                            >
                              <option value="fixed">Fixed</option>
                              <option value="variable">Variable</option>
                            </select>
                          ) : (
                            <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                              item.type === 'fixed' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {item.type}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {editingItem?.id === item.id ? (
                            <input
                              type="number"
                              value={editingItem.amount}
                              onChange={(e) => setEditingItem({...editingItem, amount: parseFloat(e.target.value)})}
                              className="w-32 px-2 py-1 border rounded text-right"
                            />
                          ) : (
                            <span className="font-semibold text-gray-800">{formatCurrency(item.amount)}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center gap-2">
                            {editingItem?.id === item.id ? (
                              <>
                                <button
                                  onClick={handleSaveEdit}
                                  className="text-green-600 hover:text-green-800"
                                  title="Save"
                                >
                                  <Save className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => setEditingItem(null)}
                                  className="text-gray-600 hover:text-gray-800"
                                  title="Cancel"
                                >
                                  <X className="w-5 h-5" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleEdit(item)}
                                  className="text-blue-600 hover:text-blue-800"
                                  title="Edit"
                                >
                                  <Edit2 className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  className="text-red-600 hover:text-red-800"
                                  title="Delete"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-100 font-semibold">
                      <td colSpan="2" className="px-4 py-3 text-right text-gray-800">Subtotal:</td>
                      <td className="px-4 py-3 text-right text-gray-800">
                        {formatCurrency(calculations.categoryTotals[category] || 0)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ))}

          {/* Total Expenses */}
          <div className="border-t-4 border-gray-300 pt-4">
            <div className="flex justify-between items-center bg-orange-50 px-6 py-4 rounded-lg">
              <span className="text-xl font-bold text-gray-800">TOTAL EXPENSES</span>
              <span className="text-2xl font-bold text-orange-600">{formatCurrency(calculations.totalExpenses)}</span>
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg p-8 mb-6 text-white">
          <h2 className="text-3xl font-bold mb-6">Financial Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-white/30 pb-3">
                <span className="text-lg">Total Revenue:</span>
                <span className="text-2xl font-bold">{formatCurrency(calculations.totalRevenue)}</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/30 pb-3">
                <span className="text-lg">Total Expenses:</span>
                <span className="text-2xl font-bold">{formatCurrency(calculations.totalExpenses)}</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/30 pb-3">
                <span className="text-lg font-semibold">Net Profit (Before Tax):</span>
                <span className="text-2xl font-bold">{formatCurrency(calculations.netProfitBeforeTax)}</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/30 pb-3">
                <span className="text-lg">Tax ({taxRate}%):</span>
                <span className="text-2xl font-bold">{formatCurrency(calculations.tax)}</span>
              </div>
              <div className="flex justify-between items-center bg-white/10 rounded-lg p-4">
                <span className="text-xl font-bold">Net Profit (After Tax):</span>
                <span className="text-3xl font-bold">{formatCurrency(calculations.netProfitAfterTax)}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white/10 rounded-lg p-4">
                <h3 className="text-xl font-bold mb-3">Profit Distribution</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-white/20 pb-2">
                    <span>Achievers Institute (70%):</span>
                    <span className="font-bold text-lg">{formatCurrency(calculations.achieversShare)}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/20 pb-2">
                    <span>Consulting Team Total (30%):</span>
                    <span className="font-bold text-lg">{formatCurrency(calculations.consultingShare)}</span>
                  </div>
                  <div className="pl-4 space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span>→ Partner 1 (15%):</span>
                      <span className="font-semibold">{formatCurrency(calculations.partner1Share)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>→ Partner 2 (15%):</span>
                      <span className="font-semibold">{formatCurrency(calculations.partner2Share)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 rounded-lg p-4">
                <h3 className="text-xl font-bold mb-3">Key Metrics</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Profit Margin:</span>
                    <span className="font-bold">{calculations.profitMargin.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cost per Student:</span>
                    <span className="font-bold">{formatCurrency(calculations.costPerStudent)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Profit Projection Chart */}
          <div ref={lineChartRef} className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Profit Projection by Student Count</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={projectionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="students" label={{ value: 'Students', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ value: 'Million LKR', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value) => `${value.toFixed(2)}M`} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue" />
                <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Expenses" />
                <Line type="monotone" dataKey="profitAfterTax" stroke="#3b82f6" strokeWidth={3} name="Profit (After Tax)" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Cost Breakdown by Category */}
          <div ref={pieChartRef} className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Cost Breakdown by Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value.toFixed(1)}M`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value.toFixed(2)}M LKR`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue vs Costs Comparison */}
        <div ref={barChartRef} className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Revenue vs Costs Analysis</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={projectionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="students" label={{ value: 'Number of Students', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Million LKR', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value) => `${value.toFixed(2)}M LKR`} />
              <Legend />
              <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
              <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
              <Bar dataKey="profitAfterTax" fill="#3b82f6" name="Net Profit (After Tax)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Break-even Analysis */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Break-even Analysis</h3>
          <div ref={breakEvenRef} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Break-even Students</p>
              <p className="text-2xl font-bold text-blue-600">
                {Math.ceil(calculations.totalExpenses / tuitionFeePerStudent)} students
              </p>
              <p className="text-xs text-gray-500 mt-1">To cover all costs</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Revenue per Student</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(tuitionFeePerStudent)}</p>
              <p className="text-xs text-gray-500 mt-1">2-year programme</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Avg Cost per Student</p>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(calculations.costPerStudent)}</p>
              <p className="text-xs text-gray-500 mt-1">Including all expenses</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Profit per Student</p>
              <p className="text-2xl font-bold text-orange-600">
                {formatCurrency((calculations.netProfitAfterTax) / studentCount)}
              </p>
              <p className="text-xs text-gray-500 mt-1">After tax</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTHMBudgetCalculator;
