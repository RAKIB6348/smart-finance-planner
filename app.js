// ---- DOM Elements Selection ----
const budgetInput = document.getElementById('budgetInput');
const budgetForm = document.getElementById('budgetForm');
const setBudgetBtn = document.getElementById('setBudgetBtn');
const viewBudget = document.getElementById('viewBudget');
const viewExpense = document.getElementById('viewExpense');
const viewBalance = document.getElementById('viewBalance');
const heroBalance = document.getElementById('heroBalance');
const trackerProgress = document.getElementById('trackerProgress');
const progressLabel = document.getElementById('progressLabel');
const expenseForm = document.getElementById('expenseForm');
const expenseList = document.getElementById('expenseList');
const emptyState = document.getElementById('emptyState');
const expenseCount = document.getElementById('expenseCount');
const expCategory = document.getElementById('expCategory');
const categoryForm = document.getElementById('categoryForm');
const categoryInput = document.getElementById('categoryInput');
const categoryList = document.getElementById('categoryList');
const categoryCount = document.getElementById('categoryCount');
const appMessage = document.getElementById('appMessage');
const budgetStatus = document.getElementById('budgetStatus');
const clearExpensesBtn = document.getElementById('clearExpensesBtn');
const resetAppBtn = document.getElementById('resetAppBtn');

const defaultCategories = ['Food', 'Rent', 'Bills', 'Entertainment'];

// ---- Application State ----
let state = {
    budget: 0,
    expenses: [],
    categories: [...defaultCategories]
};

// ---- Initialize Application (Local Storage) ----
document.addEventListener('DOMContentLoaded', () => {
    const savedState = localStorage.getItem('smart_finance_state');
    if (savedState) {
        try {
            state = JSON.parse(savedState);
        } catch {
            localStorage.removeItem('smart_finance_state');
        }
    }

    if (!Array.isArray(state.categories) || state.categories.length === 0) {
        state.categories = [...defaultCategories];
    }

    updateUI();
    renderCategories();
    renderExpenses();
});

function saveToLocalStorage() {
    localStorage.setItem('smart_finance_state', JSON.stringify(state));
}

// ---- Event Listeners ----
budgetForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const value = parseFloat(budgetInput.value);

    if (!value || value <= 0) {
        showMessage('Enter a budget amount greater than 0.', 'error');
        budgetInput.focus();
        return;
    }

    state.budget = value;
    budgetInput.value = '';
    saveToLocalStorage();
    updateUI();
    showMessage('Monthly budget updated.', 'success');
});

expenseForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const title = document.getElementById('expTitle').value.trim();
    const amount = parseFloat(document.getElementById('expAmount').value);
    const category = document.getElementById('expCategory').value;

    if (!title) {
        showMessage('Enter an expense name.', 'error');
        document.getElementById('expTitle').focus();
        return;
    }

    if (!amount || amount <= 0) {
        showMessage('Enter an expense amount greater than 0.', 'error');
        document.getElementById('expAmount').focus();
        return;
    }

    const expense = {
        id: Date.now().toString(),
        title,
        amount,
        category
    };

    state.expenses.push(expense);
    expenseForm.reset();
    
    saveToLocalStorage();
    updateUI();
    renderExpenses();
    showMessage('Expense added.', 'success');
});

categoryForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const categoryName = categoryInput.value.trim();

    if (!categoryName) {
        showMessage('Enter a category name.', 'error');
        categoryInput.focus();
        return;
    }

    if (categoryExists(categoryName)) {
        showMessage('That category already exists.', 'error');
        categoryInput.value = '';
        categoryInput.focus();
        return;
    }

    state.categories.push(categoryName);
    categoryInput.value = '';

    saveToLocalStorage();
    renderCategories(categoryName);
    updateUI();
    showMessage('Category added.', 'success');
});

clearExpensesBtn.addEventListener('click', () => {
    if (state.expenses.length === 0) {
        showMessage('There are no expenses to clear.', 'info');
        return;
    }

    const confirmed = confirm('Clear all expenses? Your budget and categories will stay.');

    if (!confirmed) {
        return;
    }

    state.expenses = [];
    saveToLocalStorage();
    updateUI();
    renderCategories();
    renderExpenses();
    showMessage('All expenses cleared.', 'success');
});

resetAppBtn.addEventListener('click', () => {
    const confirmed = confirm('Reset the whole planner? This removes budget, expenses, and custom categories.');

    if (!confirmed) {
        return;
    }

    state = {
        budget: 0,
        expenses: [],
        categories: [...defaultCategories]
    };

    saveToLocalStorage();
    updateUI();
    renderCategories();
    renderExpenses();
    showMessage('Planner reset to default.', 'success');
});

// ---- DOM Manipulation Functions ----

function updateUI() {
    const totalExpenses = state.expenses.reduce((sum, item) => sum + item.amount, 0);
    const balance = state.budget - totalExpenses;
    const percentage = state.budget > 0 ? Math.min((totalExpenses / state.budget) * 100, 100) : 0;

    viewBudget.textContent = formatCurrency(state.budget);
    viewExpense.textContent = formatCurrency(totalExpenses);
    viewBalance.textContent = formatCurrency(balance);
    heroBalance.textContent = formatCurrency(balance);
    progressLabel.textContent = `${Math.round(percentage)}%`;
    expenseCount.textContent = `${state.expenses.length} ${state.expenses.length === 1 ? 'item' : 'items'}`;
    clearExpensesBtn.disabled = state.expenses.length === 0;

    if (balance < 0) {
        viewBalance.className = 'text-danger';
        heroBalance.className = 'text-danger';
        budgetStatus.textContent = `You are over budget by ${formatCurrency(Math.abs(balance))}.`;
    } else {
        viewBalance.className = 'text-success';
        heroBalance.className = '';
        budgetStatus.textContent = state.budget > 0
            ? `${formatCurrency(balance)} remaining from your monthly budget.`
            : 'Set a budget to start tracking progress.';
    }

    trackerProgress.style.width = `${percentage}%`;

    if (percentage > 85) {
        trackerProgress.style.backgroundColor = '#dc2626';
    } else if (percentage > 60) {
        trackerProgress.style.backgroundColor = '#c2410c';
    } else {
        trackerProgress.style.backgroundColor = '#15803d';
    }
}

function renderExpenses() {
    expenseList.innerHTML = '';
    emptyState.style.display = state.expenses.length ? 'none' : 'block';
    state.expenses.forEach(expense => appendExpenseDOM(expense));
}

function renderCategories(selectedCategory = expCategory.value) {
    expCategory.innerHTML = '';
    categoryList.innerHTML = '';
    categoryCount.textContent = `${state.categories.length} ${state.categories.length === 1 ? 'category' : 'categories'}`;

    state.categories.forEach(categoryName => {
        const option = document.createElement('option');
        option.value = categoryName;
        option.textContent = categoryName;
        expCategory.appendChild(option);

        const item = document.createElement('li');
        item.className = 'category-item';

        const label = document.createElement('span');
        label.textContent = categoryName;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'category-delete-btn';
        deleteBtn.type = 'button';
        deleteBtn.setAttribute('aria-label', `Delete ${categoryName} category`);
        deleteBtn.textContent = '×';
        deleteBtn.disabled = isCategoryProtected(categoryName);
        deleteBtn.title = deleteBtn.disabled
            ? 'Delete expenses in this category before removing it.'
            : `Delete ${categoryName}`;

        deleteBtn.addEventListener('click', () => {
            deleteCategory(categoryName);
        });

        item.appendChild(label);
        item.appendChild(deleteBtn);
        categoryList.appendChild(item);
    });

    if (state.categories.includes(selectedCategory)) {
        expCategory.value = selectedCategory;
    }
}

function deleteCategory(categoryName) {
    if (isCategoryProtected(categoryName)) {
        showMessage('This category is being used by an expense, so it cannot be deleted yet.', 'error');
        return;
    }

    state.categories = state.categories.filter(category => category !== categoryName);
    saveToLocalStorage();
    renderCategories();
    showMessage('Category deleted.', 'success');
}

function appendExpenseDOM(expense) {
    // Create Elements via Core DOM Methods
    const li = document.createElement('li');
    li.className = 'expense-item';
    li.dataset.id = expense.id;

    const detailsDiv = document.createElement('div');

    const title = document.createElement('strong');
    title.className = 'expense-title';
    title.textContent = expense.title;

    const category = document.createElement('span');
    category.className = 'expense-category';
    category.textContent = expense.category;

    detailsDiv.appendChild(title);
    detailsDiv.appendChild(category);

    const rightDiv = document.createElement('div');
    rightDiv.className = 'expense-actions';

    const amountSpan = document.createElement('span');
    amountSpan.className = 'expense-amount text-danger';
    amountSpan.textContent = `-${formatCurrency(expense.amount)}`;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.type = 'button';
    deleteBtn.setAttribute('aria-label', `Delete ${expense.title}`);
    deleteBtn.textContent = '×';
    
    deleteBtn.addEventListener('click', () => {
        state.expenses = state.expenses.filter(item => item.id !== expense.id);
        saveToLocalStorage();
        updateUI();
        renderCategories();
        renderExpenses();
        showMessage('Expense deleted.', 'success');
    });

    rightDiv.appendChild(amountSpan);
    rightDiv.appendChild(deleteBtn);
    
    li.appendChild(detailsDiv);
    li.appendChild(rightDiv);

    // Insert at the beginning of the list
    expenseList.insertBefore(li, expenseList.firstChild);
}

function formatCurrency(value) {
    return `৳${Number(value).toLocaleString('en-BD', {
        maximumFractionDigits: 2
    })}`;
}

function categoryExists(categoryName) {
    return state.categories.some(category => category.toLowerCase() === categoryName.toLowerCase());
}

function isCategoryProtected(categoryName) {
    return state.categories.length === 1 || state.expenses.some(expense => expense.category === categoryName);
}

function showMessage(message, type = 'info') {
    appMessage.textContent = message;
    appMessage.className = `app-message is-visible ${type}`;

    clearTimeout(showMessage.timeoutId);
    showMessage.timeoutId = setTimeout(() => {
        appMessage.className = 'app-message';
        appMessage.textContent = '';
    }, 3000);
}
