# Attendance Risk Calculator

A simple, mobile-optimized web tool that helps you understand how close you are to triggering additional attendance warnings based on your workplace attendance rules (3 occurrences = 1 warning, 4 warnings = termination threshold).

This tool is intended for **personal reference and education only** and is designed to be used on mobile platforms. 

---

## Live Site

https://theWaffler.github.io/attendance-risk/

---

# How Attendance Tracking Works  
This tool models two timing systems used in typical attendance policies:

---

## **1. 6-Month Warning Window (Active Warning Period)**  
In most attendance systems — including the policy this tool is based on — **warnings do NOT follow a calendar year**.  
They do **not** reset on January 1st.

Instead, each warning has its own **individual 6-month lifespan**, starting on the date it is issued.

Example:  
- Warning issued: **November 4, 2025**  
- It expires automatically on: **May 4, 2026**

Only warnings that are still inside this 6-month window count toward the **4-warning termination threshold**.

So at any given moment, your number of *active warnings* depends purely on date math — not on the calendar year.

---

## **2. 12-Month Rolling Attendance Window (Occurrence Review)**  
The attendance system also uses a **rolling 12-month window**, meaning:

- HR can evaluate your absences,
- Occurrences,
- And warning patterns  
…from the **past 12 months backward from today’s date**, regardless of calendar year.

This does **not** directly cause termination by itself, but it influences:

- Whether HR issues new warnings  
- Whether your pattern is considered “excessive”  
- Whether occurrences still count when forming new warnings  

### Key Clarification  
- Occurrences **do NOT reset on Jan 1**  
- Warnings **do NOT reset on Jan 1**  
- Everything is based on **rolling dates**, not calendar year boundaries

---

# How the Calculator Works

This tool assumes:

- 1 unscheduled call-out = **1 occurrence**
- Every **3 occurrences = 1 attendance warning**
- Each warning expires **6 months** after it is issued
- The **4th active warning** is considered a termination-level event
- The calculator estimates how many “safe” occurrences remain based on those rules

This tool does **not** interpret HR policies — it simply performs the date math and occurrence math.

---

# Disclosure & Ethics Notice

This project is for **educational purposes only**.

**Do NOT abuse or manipulate your employer’s attendance policy.**  
Doing so can lead to disciplinary action or termination.

This tool is not:
- A loophole generator  
- Legal advice  
- A method to evade policy  
- An official HR calculator  

You alone are responsible for your attendance decisions and outcomes.
