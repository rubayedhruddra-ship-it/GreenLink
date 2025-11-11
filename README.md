# GreenLink

GreenLink is a web application designed to promote environmental sustainability through community engagement, recycling awareness, and item swapping.

Few Screenshots:

<img width="1858" height="906" alt="image" src="https://github.com/user-attachments/assets/e7ec878d-3983-4f60-a52c-bdc4950a79a2" />

<img width="1919" height="927" alt="image" src="https://github.com/user-attachments/assets/3a4e4f48-07be-43aa-8ae8-3fa2a13b5a3d" />

<img width="1912" height="927" alt="image" src="https://github.com/user-attachments/assets/bec9457a-0a5e-48a5-b0d2-cfbd8ad5988e" />

<img width="1872" height="907" alt="image" src="https://github.com/user-attachments/assets/50be25e5-7509-48c2-8e20-ee2c4256fc8e" />

<img width="1900" height="923" alt="image" src="https://github.com/user-attachments/assets/1f8739f2-9c98-4c03-b0d6-243c56f2ccc5" />

<img width="1819" height="912" alt="image" src="https://github.com/user-attachments/assets/84e69c50-dcc7-4dc3-9bbf-fbba06a110a9" />

<img width="1869" height="926" alt="image" src="https://github.com/user-attachments/assets/fdae5928-3beb-41db-8d2e-5ac837bde72b" />


## Features

- **Community Platform**: Connect with like-minded individuals interested in sustainability

- **Recycling Information**: Access recycling guides and best practices

- **Item Swapping**: Platform for users to exchange items, promoting reuse

- **Tips & Resources**: Educational content about environmental sustainability

- **User Profiles**: Personalized user accounts to track contributions and activities

## Technology Stack

- PHP

- MySQL

- HTML/CSS

- JavaScript

## Project Structure

```
├── api/                  # API endpoints
├── data/                 # JSON data files
├── IMG/                  # Image assets
├── inc/                 # PHP includes (configuration, database, headers)
├── uploads/             # User uploaded content
└── Various PHP/CSS/JS   # Frontend pages and assets
```

## Setup

1. Configure your web server with PHP support

2. Set up MySQL database using `mysql-init.sql`

3. Update database configuration in `inc/config.php`

4. Ensure write permissions for `uploads/` directory

## Pages

- **Home**: Main landing page (`home.php`)

- **Community**: Social interaction platform (`community.php`)

- **Recycling**: Recycling information and guides (`recycle.php`)

- **Swap**: Item exchange platform (`swap.php`)

- **Tips**: Environmental tips and resources (`tips.php`)

- **Profile**: User profile management (`profile.php`)

## Authentication

- User registration: `signup.php`

- Login system: `login.php`

- Profile management: `profile.php`

⚙️ How to Run GreenLink in XAMPP (Localhost Setup)

Follow these steps carefully to get GreenLink running on your local server using XAMPP.

🧩 Step 1: Install XAMPP

Download XAMPP from the official site:

👉 https://www.apachefriends.org/download.html

Install XAMPP on your computer (default path: C:\xampp).

Open the XAMPP Control Panel and start the following modules:

✅ Apache

✅ MySQL

📁 Step 2: Add Project to htdocs Folder

Locate your XAMPP installation directory:

C:\xampp\htdocs\


Copy or extract your project folder (GreenLink) into the htdocs directory:

C:\xampp\htdocs\GreenLink

🗄️ Step 3: Set Up the MySQL Database

-In your browser, go to: http://localhost/phpmyadmin/

-Click New on the left sidebar and create a new database named: greenlink

-After the database is created, click Import at the top menu.

-Click Choose File, then select: C:\xampp\htdocs\GreenLink\mysql-init.sql

-Click Go to import the database structure and sample data.

 OR

-Go to SQL in the top bar it will take to the code editor.

-Copy the whole SQL code from mysql-init.sql and paste it in the SQL code editor.

-Select all and click CTRL + Enter (Windows) or Cmd + Enter (Mac) the database will be ready.

⚙️ Step 4: Configure Database Connection

Open the project folder and navigate to:

C:\xampp\htdocs\GreenLink\inc\config.php


Open config.php in a text editor and verify or edit the following:

<?php
$servername = "localhost";
$username = "root";     // default XAMPP username
$password = "";         // leave blank unless you set a password
$dbname = "greenlink";  // database name you created
?>

🧾 Step 5: Set File Permissions (Optional)

If file uploads are used (for profile pictures or swap items):

Ensure the following folder exists:

C:\xampp\htdocs\GreenLink\uploads


Right-click → Properties → Security → Give “Full Control” to the current user.

🚀 Step 6: Run the Application

Open your browser and enter:

http://localhost/GreenLink/

The homepage should load successfully.

You can now:

📝 Register a new user

🔐 Log in to your account

💬 Post content, swap items, or view recycling tips

🧠 Step 7: (Optional) Manage Database with phpMyAdmin

To view users or posts, open:

http://localhost/phpmyadmin/

Select the greenlink database to see all tables and data.

⚡ Troubleshooting Tips

Issue	Possible Fix

❌ Database connection failed	Check credentials in inc/config.php

⚠️ 404 Not Found	Ensure the project folder name is exactly GreenLink

🧩 PHP errors displayed	Verify PHP version ≥ 8.0 and enable mysqli in PHP settings

📂 Upload not working	Ensure uploads/ folder has write permission

## Contributing

Feel free to submit issues and enhancement requests.

## License

© 2025 Rubayed Hossain Ruddra
All rights reserved.  
Unauthorized commercial use is prohibited.
