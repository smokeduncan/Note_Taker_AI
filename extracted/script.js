// Main JavaScript for CRM Note-Taking Application Website

// Global variables
let currentSection = 'overview';
let darkMode = false;

// Document ready function
document.addEventListener('DOMContentLoaded', function() {
    // Initialize navigation
    initNavigation();
    
    // Initialize theme toggle
    initThemeToggle();
    
    // Initialize search functionality
    initSearch();
    
    // Initialize interactive elements
    initInteractiveElements();
    
    // Initialize print functionality
    initPrintButton();
    
    // Initialize feedback form
    initFeedbackForm();
    
    // Check for URL parameters
    checkUrlParams();
});

// Initialize navigation
function initNavigation() {
    // Sidebar navigation
    const navLinks = document.querySelectorAll('.sidebar-nav .nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get section ID from href
            const targetId = this.getAttribute('href').substring(1);
            
            // Update current section
            currentSection = targetId;
            
            // Update URL with section parameter
            updateUrlParam('section', targetId);
            
            // Show selected section
            showSection(targetId);
            
            // Update active link
            navLinks.forEach(navLink => {
                navLink.classList.remove('active');
            });
            this.classList.add('active');
            
            // Close mobile sidebar if open
            const sidebar = document.querySelector('.sidebar');
            if (sidebar.classList.contains('show-mobile')) {
                sidebar.classList.remove('show-mobile');
            }
            
            // Scroll to top of section
            window.scrollTo(0, 0);
        });
    });
    
    // Mobile sidebar toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            const sidebar = document.querySelector('.sidebar');
            sidebar.classList.toggle('show-mobile');
        });
    }
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(e) {
        const sidebar = document.querySelector('.sidebar');
        const sidebarToggle = document.getElementById('sidebarToggle');
        
        if (sidebar && sidebar.classList.contains('show-mobile') && 
            !sidebar.contains(e.target) && 
            e.target !== sidebarToggle) {
            sidebar.classList.remove('show-mobile');
        }
    });
}

// Show selected section
function showSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.style.display = 'none';
    });
    
    // Show selected section
    const selectedSection = document.getElementById(sectionId);
    if (selectedSection) {
        selectedSection.style.display = 'block';
        
        // Add animation class
        selectedSection.classList.add('fade-in');
        
        // Update page title
        const sectionTitle = selectedSection.querySelector('h2')?.textContent || 'CRM Note-Taking Application';
        document.title = `${sectionTitle} - CRM Note-Taking App`;
        
        // Update breadcrumb
        updateBreadcrumb(sectionId, sectionTitle);
    }
}

// Update breadcrumb
function updateBreadcrumb(sectionId, sectionTitle) {
    const breadcrumb = document.querySelector('.breadcrumb');
    if (breadcrumb) {
        // Clear existing items except home
        while (breadcrumb.children.length > 1) {
            breadcrumb.removeChild(breadcrumb.lastChild);
        }
        
        // Add new breadcrumb item
        const li = document.createElement('li');
        li.className = 'breadcrumb-item active';
        li.textContent = sectionTitle;
        breadcrumb.appendChild(li);
    }
}

// Initialize theme toggle
function initThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        // Check for saved theme preference
        if (localStorage.getItem('darkMode') === 'true') {
            enableDarkMode();
        }
        
        themeToggle.addEventListener('click', function() {
            if (darkMode) {
                disableDarkMode();
            } else {
                enableDarkMode();
            }
        });
    }
}

// Enable dark mode
function enableDarkMode() {
    document.body.classList.add('dark-mode');
    darkMode = true;
    localStorage.setItem('darkMode', 'true');
    
    // Update toggle icon
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.innerHTML = '<i class="bi bi-sun-fill"></i>';
        themeToggle.setAttribute('title', 'Switch to Light Mode');
    }
}

// Disable dark mode
function disableDarkMode() {
    document.body.classList.remove('dark-mode');
    darkMode = false;
    localStorage.setItem('darkMode', 'false');
    
    // Update toggle icon
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.innerHTML = '<i class="bi bi-moon-fill"></i>';
        themeToggle.setAttribute('title', 'Switch to Dark Mode');
    }
}

// Initialize search functionality
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    
    if (searchInput && searchResults) {
        searchInput.addEventListener('input', function() {
            const query = this.value.trim().toLowerCase();
            
            if (query.length < 2) {
                searchResults.innerHTML = '';
                searchResults.style.display = 'none';
                return;
            }
            
            // Perform search
            const results = performSearch(query);
            
            // Display results
            if (results.length > 0) {
                let resultsHtml = '<ul class="list-group">';
                results.forEach(result => {
                    resultsHtml += `
                        <li class="list-group-item">
                            <a href="#${result.section}" class="search-result-link" data-section="${result.section}">
                                <div class="d-flex justify-content-between align-items-center">
                                    <strong>${result.title}</strong>
                                    <span class="badge bg-primary">${result.section}</span>
                                </div>
                                <p class="mb-0 text-muted">${result.preview}</p>
                            </a>
                        </li>
                    `;
                });
                resultsHtml += '</ul>';
                searchResults.innerHTML = resultsHtml;
                searchResults.style.display = 'block';
                
                // Add click event to search results
                const searchResultLinks = document.querySelectorAll('.search-result-link');
                searchResultLinks.forEach(link => {
                    link.addEventListener('click', function(e) {
                        e.preventDefault();
                        const section = this.getAttribute('data-section');
                        
                        // Show section
                        showSection(section);
                        
                        // Update active link in sidebar
                        const navLinks = document.querySelectorAll('.sidebar-nav .nav-link');
                        navLinks.forEach(navLink => {
                            navLink.classList.remove('active');
                            if (navLink.getAttribute('href') === `#${section}`) {
                                navLink.classList.add('active');
                            }
                        });
                        
                        // Clear search
                        searchInput.value = '';
                        searchResults.innerHTML = '';
                        searchResults.style.display = 'none';
                    });
                });
            } else {
                searchResults.innerHTML = '<p class="p-3 text-muted">No results found</p>';
                searchResults.style.display = 'block';
            }
        });
        
        // Close search results when clicking outside
        document.addEventListener('click', function(e) {
            if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
                searchResults.innerHTML = '';
                searchResults.style.display = 'none';
            }
        });
    }
}

// Perform search
function performSearch(query) {
    const results = [];
    
    // Get all content sections
    const sections = document.querySelectorAll('.content-section');
    
    sections.forEach(section => {
        const sectionId = section.id;
        const sectionTitle = section.querySelector('h2')?.textContent || 'Untitled Section';
        const sectionContent = section.textContent.toLowerCase();
        
        if (sectionContent.includes(query)) {
            // Find the context around the match
            const index = sectionContent.indexOf(query);
            const start = Math.max(0, index - 30);
            const end = Math.min(sectionContent.length, index + query.length + 30);
            let preview = '...' + sectionContent.substring(start, end) + '...';
            
            // Highlight the query in the preview
            preview = preview.replace(new RegExp(query, 'gi'), match => `<mark>${match}</mark>`);
            
            results.push({
                section: sectionId,
                title: sectionTitle,
                preview: preview
            });
        }
    });
    
    return results;
}

// Initialize interactive elements
function initInteractiveElements() {
    // Initialize accordions
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    accordionHeaders.forEach(header => {
        header.addEventListener('click', function() {
            this.classList.toggle('active');
            const content = this.nextElementSibling;
            if (content.style.maxHeight) {
                content.style.maxHeight = null;
            } else {
                content.style.maxHeight = content.scrollHeight + 'px';
            }
        });
    });
    
    // Initialize tabs
    const tabLinks = document.querySelectorAll('.tab-link');
    tabLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get tab ID from data attribute
            const tabId = this.getAttribute('data-tab');
            
            // Hide all tab contents
            const tabContents = document.querySelectorAll('.tab-content');
            tabContents.forEach(content => {
                content.style.display = 'none';
            });
            
            // Show selected tab content
            const selectedTab = document.getElementById(tabId);
            if (selectedTab) {
                selectedTab.style.display = 'block';
            }
            
            // Update active tab
            tabLinks.forEach(tabLink => {
                tabLink.classList.remove('active');
            });
            this.classList.add('active');
        });
    });
    
    // Initialize tooltips
    const tooltipElements = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltipElements.forEach(element => {
        new bootstrap.Tooltip(element);
    });
    
    // Initialize popovers
    const popoverElements = document.querySelectorAll('[data-bs-toggle="popover"]');
    popoverElements.forEach(element => {
        new bootstrap.Popover(element);
    });
}

// Initialize print button
function initPrintButton() {
    const printButton = document.getElementById('printButton');
    if (printButton) {
        printButton.addEventListener('click', function() {
            window.print();
        });
    }
}

// Initialize feedback form
function initFeedbackForm() {
    const feedbackForm = document.getElementById('feedbackForm');
    if (feedbackForm) {
        feedbackForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const name = document.getElementById('feedbackName').value;
            const email = document.getElementById('feedbackEmail').value;
            const message = document.getElementById('feedbackMessage').value;
            
            // Validate form
            if (!name || !email || !message) {
                alert('Please fill in all fields');
                return;
            }
            
            // Simulate form submission
            const submitButton = document.getElementById('feedbackSubmit');
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Sending...';
            
            setTimeout(() => {
                // Show success message
                const formContainer = document.getElementById('feedbackFormContainer');
                const successMessage = document.getElementById('feedbackSuccess');
                
                formContainer.style.display = 'none';
                successMessage.style.display = 'block';
                
                // Reset form
                feedbackForm.reset();
                submitButton.disabled = false;
                submitButton.innerHTML = 'Submit Feedback';
            }, 1500);
        });
    }
}

// Check for URL parameters
function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const sectionParam = urlParams.get('section');
    
    if (sectionParam) {
        // Show specified section
        showSection(sectionParam);
        
        // Update active link in sidebar
        const navLinks = document.querySelectorAll('.sidebar-nav .nav-link');
        navLinks.forEach(navLink => {
            navLink.classList.remove('active');
            if (navLink.getAttribute('href') === `#${sectionParam}`) {
                navLink.classList.add('active');
            }
        });
    } else {
        // Show default section
        showSection('overview');
        
        // Update active link in sidebar
        const defaultLink = document.querySelector('.sidebar-nav .nav-link[href="#overview"]');
        if (defaultLink) {
            defaultLink.classList.add('active');
        }
    }
}

// Update URL parameter
function updateUrlParam(key, value) {
    const url = new URL(window.location);
    url.searchParams.set(key, value);
    window.history.pushState({}, '', url);
}

// Export PDF functionality
function exportPdf() {
    alert('PDF export functionality would be implemented here.');
    // In a real implementation, this would use a library like jsPDF or 
    // call a server-side endpoint to generate a PDF
}

// Share functionality
function shareContent() {
    // Get current URL with section parameter
    const url = new URL(window.location);
    url.searchParams.set('section', currentSection);
    
    // Check if Web Share API is available
    if (navigator.share) {
        navigator.share({
            title: document.title,
            url: url.toString()
        })
        .catch(error => {
            console.error('Error sharing:', error);
            fallbackShare(url);
        });
    } else {
        fallbackShare(url);
    }
}

// Fallback share method
function fallbackShare(url) {
    // Create a temporary input to copy the URL
    const input = document.createElement('input');
    
(Content truncated due to size limit. Use line ranges to read in chunks)