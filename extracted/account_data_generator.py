import json
import random
from datetime import datetime, timedelta
import uuid

# Lists for generating random data
industries = ["Technology", "Healthcare", "Finance", "Manufacturing", "Retail", "Education", 
              "Telecommunications", "Energy", "Transportation", "Hospitality", "Media", "Construction"]

company_types = ["Corporation", "LLC", "Partnership", "Sole Proprietorship", "Non-Profit"]

company_prefixes = ["Tech", "Global", "Advanced", "Premier", "Elite", "Innovative", "Strategic", 
                    "Dynamic", "Precision", "Unified", "Integrated", "Smart", "Digital", "Modern"]

company_suffixes = ["Solutions", "Systems", "Technologies", "Industries", "Enterprises", "Group", 
                   "Partners", "Associates", "Services", "Innovations", "Networks", "Dynamics"]

company_descriptors = ["International", "Consulting", "Development", "Management", "Analytics", 
                      "Engineering", "Communications", "Healthcare", "Financial", "Manufacturing"]

countries = ["United States", "Canada", "United Kingdom", "Germany", "France", "Australia", 
             "Japan", "Singapore", "Brazil", "India", "Spain", "Italy", "Netherlands"]

states_us = ["AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", 
             "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", 
             "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", 
             "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"]

cities_us = ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", 
             "San Antonio", "San Diego", "Dallas", "San Jose", "Austin", "Jacksonville", 
             "Fort Worth", "Columbus", "San Francisco", "Charlotte", "Indianapolis", "Seattle", 
             "Denver", "Washington", "Boston", "Nashville", "Baltimore", "Portland", "Las Vegas"]

account_statuses = ["Active", "Inactive", "Prospect", "Lead", "Customer", "Former Customer", "On Hold"]

# Function to generate a random company name
def generate_company_name():
    name_pattern = random.choice([
        f"{random.choice(company_prefixes)} {random.choice(company_suffixes)}",
        f"{random.choice(company_prefixes)} {random.choice(company_descriptors)} {random.choice(company_suffixes)}",
        f"{random.choice(company_prefixes)}{random.choice(company_suffixes)}",
        f"{random.choice(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'])}-{random.choice(company_descriptors)}",
    ])
    return name_pattern

# Function to generate a random address
def generate_address():
    country = random.choice(countries)
    
    if country == "United States":
        state = random.choice(states_us)
        city = random.choice(cities_us)
    else:
        state = ""
        city = f"{country} City"
    
    street_number = random.randint(1, 9999)
    street_name = f"{random.choice(['Main', 'First', 'Second', 'Third', 'Fourth', 'Fifth', 'Oak', 'Pine', 'Maple', 'Cedar', 'Elm', 'Washington', 'Lincoln', 'Jefferson', 'Roosevelt', 'Madison', 'Adams', 'Wilson', 'Jackson', 'Monroe'])} {random.choice(['Street', 'Avenue', 'Boulevard', 'Road', 'Lane', 'Drive', 'Court', 'Place', 'Circle', 'Way'])}"
    
    zip_code = f"{random.randint(10000, 99999)}"
    
    return {
        "street": f"{street_number} {street_name}",
        "city": city,
        "state": state,
        "zip": zip_code,
        "country": country
    }

# Function to generate a random phone number
def generate_phone():
    return f"+{random.randint(1, 9)}{random.randint(100, 999)}{random.randint(100, 999)}{random.randint(1000, 9999)}"

# Function to generate a random email
def generate_email(company_name):
    domains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "aol.com", "protonmail.com"]
    company_domain = company_name.lower().replace(" ", "").replace("-", "") + ".com"
    
    if random.random() < 0.7:  # 70% chance of company email
        email_domain = company_domain
    else:
        email_domain = random.choice(domains)
    
    first_names = ["john", "jane", "robert", "mary", "michael", "linda", "william", "patricia", "david", "jennifer", "richard", "elizabeth", "joseph", "susan", "thomas", "jessica", "charles", "sarah", "daniel", "karen"]
    last_names = ["smith", "johnson", "williams", "brown", "jones", "garcia", "miller", "davis", "rodriguez", "martinez", "hernandez", "lopez", "gonzalez", "wilson", "anderson", "thomas", "taylor", "moore", "jackson", "martin"]
    
    email_prefix = random.choice([
        f"{random.choice(first_names)}.{random.choice(last_names)}",
        f"{random.choice(first_names)}{random.choice(last_names)}",
        f"{random.choice(first_names)[0]}{random.choice(last_names)}",
        f"info",
        f"sales",
        f"support",
        f"contact"
    ])
    
    return f"{email_prefix}@{email_domain}"

# Function to generate a random date within the past 5 years
def generate_date(days_ago_max=1825):  # 5 years = 1825 days
    days_ago = random.randint(0, days_ago_max)
    return (datetime.now() - timedelta(days=days_ago)).strftime("%Y-%m-%d")

# Function to generate random revenue
def generate_revenue():
    revenue_base = random.choice([
        random.randint(10000, 999999),  # Small to medium
        random.randint(1000000, 9999999),  # Medium to large
        random.randint(10000000, 999999999)  # Large to enterprise
    ])
    return revenue_base

# Function to generate a random account
def generate_account(account_id):
    company_name = generate_company_name()
    industry = random.choice(industries)
    company_type = random.choice(company_types)
    address = generate_address()
    
    # Generate 1-3 random contacts for this account
    num_contacts = random.randint(1, 3)
    contacts = []
    
    for _ in range(num_contacts):
        contact = {
            "contact_id": str(uuid.uuid4()),
            "first_name": random.choice(["John", "Jane", "Robert", "Mary", "Michael", "Linda", "William", "Patricia", "David", "Jennifer", "Richard", "Elizabeth", "Joseph", "Susan", "Thomas", "Jessica", "Charles", "Sarah", "Daniel", "Karen"]),
            "last_name": random.choice(["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"]),
            "title": random.choice(["CEO", "CTO", "CFO", "COO", "President", "Vice President", "Director", "Manager", "Supervisor", "Team Lead", "Specialist", "Analyst", "Coordinator", "Administrator", "Assistant"]),
            "email": generate_email(company_name),
            "phone": generate_phone(),
            "primary": _ == 0  # First contact is primary
        }
        contacts.append(contact)
    
    # Generate 0-5 random notes for this account
    num_notes = random.randint(0, 5)
    notes = []
    
    note_templates = [
        "Had a call with {contact_name} about their {topic}. They expressed interest in our {product} solution. Follow up in {days} days.",
        "Met with {contact_name} to discuss {topic}. They have concerns about {concern} but are open to a proposal.",
        "{contact_name} requested information about {topic}. Sent over materials and scheduled a follow-up for next {day_of_week}.",
        "Quarterly review with {contact_name}. Account is {status}. Key issues: {concern}. Next steps: {next_steps}.",
        "Support call with {contact_name} regarding {concern}. Issue {resolution_status}. Follow-up needed: {follow_up}.",
        "Contract renewal discussion with {contact_name}. Current contract expires on {date}. They want to {renewal_action}.",
        "Product demo for {contact_name} and team. They were particularly interested in {feature}. Questions about {topic}.",
        "Strategy meeting with {contact_name}. Discussed expansion opportunities in {area}. They plan to {plan}.",
        "Troubleshooting session with {contact_name} on {topic}. Issue was related to {concern}. Resolution: {resolution}.",
        "Annual review with {contact_name}. Overall satisfaction: {satisfaction}. Areas for improvement: {improvement}."
    ]
    
    topics = ["product features", "pricing", "implementation timeline", "technical specifications", "support options", 
              "integration capabilities", "customization options", "training requirements", "contract terms", "expansion plans"]
    
    products = ["CRM", "ERP", "HCM", "SCM", "BI", "AI", "ML", "IoT", "Cloud", "Security", "Analytics", "Mobile", "Web", "Desktop"]
    
    concerns = ["pricing", "implementation timeline", "technical complexity", "resource requirements", "ROI", 
                "compatibility", "scalability", "security", "compliance", "support availability"]
    
    days_of_week = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    
    statuses = ["performing well", "stable", "growing", "declining", "at risk", "exceeding expectations", "below target"]
    
    next_steps = ["schedule follow-up call", "send proposal", "arrange demo", "provide case studies", 
                  "connect with technical team", "review contract", "discuss discount options"]
    
    resolution_statuses = ["resolved", "pending", "escalated", "under investigation", "requires further action"]
    
    follow_ups = ["Yes", "No"]
    
    renewal_actions = ["renew at current terms", "upgrade package", "downgrade package", "renegotiate terms", 
                       "evaluate competitors", "extend for short term", "cancel service"]
    
    features = ["reporting dashboard", "mobile access", "automation tools", "integration capabilities", 
                "customization options", "user management", "analytics", "security features"]
    
    areas = ["North America", "Europe", "Asia", "Latin America", "Australia", "Africa", "Middle East"]
    
    plans = ["increase budget", "add more users", "expand to new department", "implement additional modules", 
             "upgrade to premium tier", "pilot new features", "roll out globally"]
    
    resolutions = ["configuration change", "software update", "training provided", "workaround implemented", 
                   "feature request submitted", "bug fix scheduled", "hardware upgrade recommended"]
    
    satisfactions = ["Excellent", "Good", "Satisfactory", "Mixed", "Poor", "Very Poor"]
    
    improvements = ["response time", "product reliability", "feature set", "user interface", "documentation", 
                    "training materials", "support availability", "pricing structure"]
    
    for i in range(num_notes):
        # Select a random contact from this account's contacts
        contact = random.choice(contacts)
        contact_name = f"{contact['first_name']} {contact['last_name']}"
        
        # Generate a date for this note (more recent notes for lower i values)
        note_date = generate_date(days_ago_max=365 - i*60)  # Spread notes over roughly a year
        
        # Fill in the template with random values
        template = random.choice(note_templates)
        note_text = template.format(
            contact_name=contact_name,
            topic=random.choice(topics),
            product=random.choice(products),
            days=random.randint(3, 30),
            concern=random.choice(concerns),
            day_of_week=random.choice(days_of_week),
            status=random.choice(statuses),
            next_steps=random.choice(next_steps),
            resolution_status=random.choice(resolution_statuses),
            follow_up=random.choice(follow_ups),
            date=(datetime.now() + timedelta(days=random.randint(30, 365))).strftime("%Y-%m-%d"),
            renewal_action=random.choice(renewal_actions),
            feature=random.choice(features),
            area=random.choice(areas),
            plan=random.choice(plans),
            resolution=random.choice(resolutions),
            satisfaction=random.choice(satisfactions),
            improvement=random.choice(improvements)
        )
        
        note = {
            "note_id": str(uuid.uuid4()),
            "date": note_date,
            "author": random.choice(["Alex Johnson", "Sam Williams", "Taylor Smith", "Jordan Brown", "Casey Davis"]),
            "content": note_text,
            "related_contact": contact["contact_id"]
        }
        notes.append(note)
    
    return {
        "account_id": account_id,
        "company_name": company_name,
        "industry": industry,
        "company_type": company_type,
        "annual_revenue": generate_revenue(),
        "employee_count": random.randint(5, 10000),
        "website": f"https://www.{company_name.lower().replace(' ', '').replace('-', '')}.com",
        "address": address,
        "phone": generate_phone(),
        "email": f"info@{company_name.lower().replace(' ', '').replace('-', '')}.com",
        "status": random.choice(account_statuses),
        "created_date": generate_date(),
        "last_contact_date": generate_date(days_ago_max=90),
        "account_owner": random.choice(["Alex Johnson", "Sam Williams", "Taylor Smith", "Jordan Brown", "Casey Davis"]),
        "contacts": contacts,
        "notes": notes
    }

# Generate 50 accounts
accounts = []
for i in range(1, 51):
    account_id = f"ACC{i:04d}"
    account = generate_account(account_id)
    accounts.append(account)

# Save to JSON file
with open('accounts.json', 'w') as f:
    json.dump(accounts, f, indent=2)

print(f"Generated {len(accounts)} accounts and saved to accounts.json")
