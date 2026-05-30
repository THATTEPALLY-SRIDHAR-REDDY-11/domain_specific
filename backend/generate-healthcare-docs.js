
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const docsDir = path.join(__dirname, 'documents');

if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

const documentData = [
  // Disease Documents (1-15)
  {
    name: "1-Diabetes-Management-Guide.md",
    title: "Diabetes Management Guide",
    content: `# Diabetes Management Guide

## Overview
Diabetes management focuses on keeping blood sugar levels within target ranges to prevent complications.

## Key Information
- Monitor blood glucose levels regularly (fasting and postprandial)
- Take medications as prescribed (insulin or oral hypoglycemics)
- Follow a balanced diet low in added sugars and refined carbohydrates
- Engage in regular physical activity (30 minutes/day, 5 days/week)
- Attend regular check-ups with endocrinologist or primary care provider

## Important Guidelines
- Target fasting blood glucose: 80-130 mg/dL
- Target postprandial blood glucose: <180 mg/dL
- Always carry glucose tablets for hypoglycemia
- Wear a medical alert bracelet
- Stay hydrated and avoid excessive alcohol`
  },
  {
    name: "2-Hypertension-Treatment-Guidelines.md",
    title: "Hypertension Treatment Guidelines",
    content: `# Hypertension Treatment Guidelines

## Overview
Hypertension (high blood pressure) treatment aims to reduce cardiovascular risk.

## Key Information
- Normal blood pressure: <120/<80 mmHg
- Elevated: 120-129/<80 mmHg
- Stage 1: 130-139/80-89 mmHg
- Stage 2: ≥140/≥90 mmHg

## Important Guidelines
- Lifestyle modifications first: low-sodium diet, regular exercise, weight management, stress reduction
- Medications may include ACE inhibitors, ARBs, calcium channel blockers, or diuretics
- Monitor blood pressure at home regularly
- Follow up with provider every 1-3 months until controlled`
  },
  {
    name: "3-Asthma-Care-Manual.md",
    title: "Asthma Care Manual",
    content: `# Asthma Care Manual

## Overview
Asthma care focuses on preventing attacks and managing symptoms.

## Key Information
- Use controller inhalers daily (e.g., inhaled corticosteroids)
- Use rescue inhalers (albuterol) for quick relief during attacks
- Identify and avoid triggers (smoke, dust mites, pollen, air pollution)
- Have an asthma action plan in writing

## Important Guidelines
- Wash bedding weekly in hot water to reduce dust mites
- Keep humidity <50% to prevent mold
- Get annual flu vaccine
- Seek emergency care for severe shortness of breath`
  },
  {
    name: "4-COVID-19-Protocols.md",
    title: "COVID-19 Protocols",
    content: `# COVID-19 Protocols

## Overview
Guidelines for COVID-19 prevention and management.

## Key Information
- Vaccination: stay up to date with recommended COVID-19 vaccines
- Testing: get tested if you have symptoms or were exposed
- Isolation: isolate for at least 5 days if positive
- Masking: wear a well-fitting mask in crowded indoor spaces if transmission is high

## Important Guidelines
- Symptoms: fever, cough, fatigue, loss of taste/smell
- If positive, notify close contacts
- Monitor symptoms and seek care if breathing is difficult
- Antiviral treatments are available for high-risk individuals`
  },
  {
    name: "5-Heart-Disease-Handbook.md",
    title: "Heart Disease Handbook",
    content: `# Heart Disease Handbook

## Overview
Information about preventing and managing heart disease.

## Key Information
- Risk factors: high blood pressure, high cholesterol, smoking, diabetes, family history
- Prevention: healthy diet, regular exercise, no smoking, limit alcohol
- Symptoms of heart attack: chest pain/discomfort, shortness of breath, discomfort in arms/back/jaw

## Important Guidelines
- Eat a diet rich in fruits, vegetables, whole grains, and lean proteins
- Aim for at least 150 minutes of moderate exercise weekly
- Take cholesterol and blood pressure medications as prescribed
- Know the signs of heart attack and call 911 immediately`
  },
  {
    name: "6-Cancer-Awareness-Guide.md",
    title: "Cancer Awareness Guide",
    content: `# Cancer Awareness Guide

## Overview
Information about cancer prevention, screening, and early detection.

## Key Information
- Many cancers are preventable through lifestyle changes
- Early detection significantly improves outcomes
- Screening recommendations vary by age and risk factors

## Important Guidelines
- Avoid tobacco in all forms
- Limit alcohol consumption
- Protect skin from excessive sun exposure
- Get recommended screenings: mammograms, colonoscopies, Pap smears, etc.
- See a doctor for unusual symptoms that persist`
  },
  {
    name: "7-Kidney-Disease-Reference.md",
    title: "Kidney Disease Reference",
    content: `# Kidney Disease Reference

## Overview
Information about kidney health and disease.

## Key Information
- Kidneys filter waste and excess fluid from blood
- Chronic kidney disease (CKD) often has no early symptoms
- Diabetes and high blood pressure are leading causes of CKD

## Important Guidelines
- Control blood sugar and blood pressure
- Stay hydrated but don't overhydrate
- Limit sodium intake
- Avoid overuse of NSAIDs (ibuprofen, naproxen)
- Get regular kidney function tests if at risk`
  },
  {
    name: "8-Liver-Disease-Guide.md",
    title: "Liver Disease Guide",
    content: `# Liver Disease Guide

## Overview
Information about liver health and common conditions.

## Key Information
- The liver processes nutrients, filters blood, and fights infections
- Common liver conditions: hepatitis, fatty liver disease, cirrhosis
- Many liver diseases are preventable

## Important Guidelines
- Limit alcohol consumption
- Practice safe sex to prevent hepatitis B and C
- Avoid sharing needles
- Maintain a healthy weight to prevent fatty liver
- Get hepatitis A and B vaccines if recommended`
  },
  {
    name: "9-Thyroid-Disorders-Manual.md",
    title: "Thyroid Disorders Manual",
    content: `# Thyroid Disorders Manual

## Overview
Information about common thyroid conditions.

## Key Information
- The thyroid produces hormones that regulate metabolism
- Hypothyroidism: underactive thyroid, symptoms include fatigue, weight gain, cold intolerance
- Hyperthyroidism: overactive thyroid, symptoms include weight loss, rapid heartbeat, anxiety

## Important Guidelines
- Thyroid disorders are treatable with medication
- Blood tests (TSH, T4) are used for diagnosis
- Take thyroid medication on an empty stomach
- Have regular follow-ups to adjust medication dosage`
  },
  {
    name: "10-Arthritis-Treatment-Guide.md",
    title: "Arthritis Treatment Guide",
    content: `# Arthritis Treatment Guide

## Overview
Information about managing arthritis symptoms.

## Key Information
- Arthritis causes joint pain, stiffness, and swelling
- Osteoarthritis (wear and tear) and rheumatoid arthritis (autoimmune) are most common
- Treatment focuses on reducing pain and improving function

## Important Guidelines
- Stay physically active with low-impact exercise (walking, swimming, cycling)
- Maintain a healthy weight to reduce joint stress
- Apply heat or cold to painful joints
- Use assistive devices if needed (canes, braces)
- Medications may include pain relievers or anti-inflammatories`
  },
  {
    name: "11-Tuberculosis-Management.md",
    title: "Tuberculosis Management",
    content: `# Tuberculosis Management

## Overview
Guidelines for tuberculosis (TB) prevention and treatment.

## Key Information
- TB is a bacterial infection that usually affects the lungs
- Spread through coughs/sneezes of infected individuals
- Many people have latent TB (infected but not sick)

## Important Guidelines
- Get tested if you've been exposed
- TB treatment requires multiple medications for 6-9 months
- Take all medications exactly as prescribed to prevent drug resistance
- People with active TB may need to isolate initially`
  },
  {
    name: "12-Dengue-Fever-Protocol.md",
    title: "Dengue Fever Protocol",
    content: `# Dengue Fever Protocol

## Overview
Information about dengue fever.

## Key Information
- Dengue is spread by Aedes mosquitoes
- Symptoms: high fever, severe headache, pain behind eyes, joint/muscle pain, rash
- No specific antiviral treatment

## Important Guidelines
- Prevent mosquito bites: use repellent, wear long clothes, use bed nets
- Remove standing water where mosquitoes breed
- Seek medical care if you have symptoms
- Avoid NSAIDs (ibuprofen) as they can increase bleeding risk`
  },
  {
    name: "13-Malaria-Prevention-Guide.md",
    title: "Malaria Prevention Guide",
    content: `# Malaria Prevention Guide

## Overview
Guidelines for preventing malaria.

## Key Information
- Malaria is spread by Anopheles mosquitoes
- Can be life-threatening if not treated promptly
- Prevention is key, especially when traveling to high-risk areas

## Important Guidelines
- Take antimalarial medications as prescribed before, during, and after travel
- Use insect repellent with DEET, picaridin, or IR3535
- Sleep under insecticide-treated bed nets
- Wear long-sleeved shirts and long pants at night`
  },
  {
    name: "14-Obesity-Management-Guide.md",
    title: "Obesity Management Guide",
    content: `# Obesity Management Guide

## Overview
Information about managing obesity for better health.

## Key Information
- Obesity increases risk of diabetes, heart disease, sleep apnea, and certain cancers
- Body Mass Index (BMI) ≥30 is considered obese
- Weight management requires a long-term, sustainable approach

## Important Guidelines
- Aim for a balanced, calorie-appropriate diet
- Increase physical activity gradually
- Set realistic weight loss goals (1-2 lbs per week)
- Seek support from healthcare providers, dietitians, or support groups
- Focus on overall health improvements, not just weight`
  },
  {
    name: "15-Mental-Health-Handbook.md",
    title: "Mental Health Handbook",
    content: `# Mental Health Handbook

## Overview
Information about mental health and wellness.

## Key Information
- Mental health is as important as physical health
- Common mental health conditions: anxiety, depression, bipolar disorder
- Treatment is effective and available

## Important Guidelines
- Talk to someone you trust if you're struggling
- Practice self-care: sleep, exercise, hobbies, mindfulness
- Avoid excessive alcohol and drug use
- Seek professional help if symptoms persist
- Crisis resources are available (hotlines, emergency rooms)`
  },

  // Symptom & Diagnosis (16-25)
  {
    name: "16-Fever-Assessment-Guide.md",
    title: "Fever Assessment Guide",
    content: `# Fever Assessment Guide

## Overview
How to assess and manage a fever.

## Key Information
- Normal body temperature: ~98.6°F (37°C)
- Fever: ≥100.4°F (38°C)
- Fevers help the body fight infection

## Important Guidelines
- For adults, seek care if fever >103°F or lasts >3 days
- For children, seek care if fever >102°F or appears very ill
- Stay hydrated
- Rest
- Over-the-counter medications (acetaminophen, ibuprofen) can reduce fever if needed
- Do not give aspirin to children/teens (Reye's syndrome risk)`
  },
  {
    name: "17-Chest-Pain-Diagnosis.md",
    title: "Chest Pain Diagnosis",
    content: `# Chest Pain Diagnosis

## Overview
Guidelines for evaluating chest pain.

## Key Information
- Chest pain has many causes (heart, lungs, muscles, digestion)
- Heart attack chest pain is often pressure-like, may radiate to arm/jaw
- Always take chest pain seriously

## Important Guidelines
- Call 911 immediately for severe, sudden chest pain, especially with shortness of breath, sweating, nausea
- Keep a diary of when pain occurs, what triggers it, what relieves it
- See a doctor promptly for any unexplained chest pain`
  },
  {
    name: "18-Cough-Evaluation-Manual.md",
    title: "Cough Evaluation Manual",
    content: `# Cough Evaluation Manual

## Overview
How to evaluate a cough.

## Key Information
- Acute cough: <3 weeks (usually from cold/flu)
- Subacute: 3-8 weeks
- Chronic: >8 weeks (possible asthma, allergies, GERD, chronic bronchitis)

## Important Guidelines
- See a doctor if cough lasts >3 weeks, has blood, or is with fever/shortness of breath
- Stay hydrated
- Use a humidifier for dry cough
- Avoid irritants (smoke, strong odors)
- Over-the-counter cough medicines may help some symptoms`
  },
  {
    name: "19-Headache-Diagnosis-Guide.md",
    title: "Headache Diagnosis Guide",
    content: `# Headache Diagnosis Guide

## Overview
Information about common headaches.

## Key Information
- Most headaches are tension-type or migraine
- Migraines often have throbbing pain, nausea, sensitivity to light/sound
- "Red flag" headaches need immediate attention

## Important Guidelines
- Seek emergency care if headache is sudden/severe, with fever/stiff neck/confusion/vision changes
- Keep a headache diary to identify triggers
- Manage stress
- Get enough sleep
- Stay hydrated
- Over-the-counter pain relievers may help (don't overuse)`
  },
  {
    name: "20-Skin-Disease-Reference.md",
    title: "Skin Disease Reference",
    content: `# Skin Disease Reference

## Overview
Information about common skin conditions.

## Key Information
- Common skin conditions: acne, eczema, psoriasis, dermatitis, fungal infections
- Many can be managed with proper care
- See a dermatologist for persistent or severe conditions

## Important Guidelines
- Keep skin clean and moisturized
- Wear sunscreen daily (SPF ≥30)
- Avoid harsh soaps and irritants
- Don't scratch itchy skin (can cause infection or scarring)
- See a doctor if skin condition is painful, spreading, or infected`
  },
  {
    name: "21-Neurological-Symptoms-Manual.md",
    title: "Neurological Symptoms Manual",
    content: `# Neurological Symptoms Manual

## Overview
Information about common neurological symptoms.

## Key Information
- Neurological symptoms relate to the brain, spinal cord, and nerves
- Common symptoms: numbness, tingling, weakness, dizziness, seizures, memory problems
- Some symptoms require urgent evaluation

## Important Guidelines
- Seek emergency care for sudden severe headache, loss of consciousness, new weakness/numbness on one side, difficulty speaking
- See a neurologist for persistent neurological symptoms
- Keep track of when symptoms occur and any triggers`
  },
  {
    name: "22-Respiratory-Disorders-Guide.md",
    title: "Respiratory Disorders Guide",
    content: `# Respiratory Disorders Guide

## Overview
Information about common respiratory conditions.

## Key Information
- Common respiratory conditions: asthma, COPD, pneumonia, bronchitis
- Symptoms often include cough, shortness of breath, wheezing

## Important Guidelines
- Don't smoke and avoid secondhand smoke
- Get annual flu vaccine and recommended COVID and pneumonia vaccines
- Avoid air pollution and irritants
- Use inhalers as prescribed for asthma/COPD
- Seek care for worsening shortness of breath`
  },
  {
    name: "23-Gastrointestinal-Symptoms-Guide.md",
    title: "Gastrointestinal Symptoms Guide",
    content: `# Gastrointestinal Symptoms Guide

## Overview
Information about common GI symptoms.

## Key Information
- Common GI symptoms: heartburn, nausea, vomiting, diarrhea, constipation, abdominal pain
- Many are temporary and manageable at home

## Important Guidelines
- Stay hydrated with vomiting/diarrhea
- Eat small, bland meals for upset stomach
- Seek care for severe pain, vomiting blood, blood in stool, or persistent symptoms >1-2 weeks
- Eat a high-fiber diet for constipation
- Over-the-counter antacids may help heartburn`
  },
  {
    name: "24-Pediatric-Symptoms-Handbook.md",
    title: "Pediatric Symptoms Handbook",
    content: `# Pediatric Symptoms Handbook

## Overview
Guidelines for common symptoms in children.

## Key Information
- Children may not be able to describe symptoms well
- Trust your instincts as a caregiver

## Important Guidelines
- Seek urgent care if child has trouble breathing, severe abdominal pain, unresponsiveness, seizures, or high fever with stiff neck/lethargy
- Keep immunizations up to date
- Use age-appropriate doses of medications
- Consult pediatrician before giving any medications to infants
- Have a first-aid kit at home`
  },
  {
    name: "25-Emergency-Symptoms-Guide.md",
    title: "Emergency Symptoms Guide",
    content: `# Emergency Symptoms Guide

## Overview
Symptoms that require immediate medical attention.

## Key Information
- Call 911 or go to emergency room immediately for these symptoms

## Important Guidelines
- Emergency symptoms include:
  - Chest pain/pressure
  - Difficulty breathing
  - Sudden severe headache
  - Sudden weakness/numbness on one side
  - Slurred speech
  - Severe abdominal pain
  - Uncontrolled bleeding
  - Severe allergic reaction
  - Loss of consciousness
  - Seizures
- When in doubt, seek emergency care`
  },

  // Treatment (26-35)
  {
    name: "26-Medication-Administration-Manual.md",
    title: "Medication Administration Manual",
    content: `# Medication Administration Manual

## Overview
Guidelines for safe medication use.

## Key Information
- Take medications exactly as prescribed
- Ask your provider or pharmacist if you have questions

## Important Guidelines
- Keep a list of all medications you take (prescription, OTC, supplements)
- Read medication labels carefully
- Take at the right time and dose
- Do not skip doses or double up if you miss a dose (ask provider what to do)
- Store medications properly
- Check for drug interactions
- Discard expired medications safely`
  },
  {
    name: "27-Antibiotic-Guidelines.md",
    title: "Antibiotic Guidelines",
    content: `# Antibiotic Guidelines

## Overview
Guidelines for appropriate antibiotic use.

## Key Information
- Antibiotics fight bacterial infections, NOT viruses (colds, flu, most sore throats)
- Overuse leads to antibiotic resistance

## Important Guidelines
- Take antibiotics only when prescribed by a doctor
- Take the full course, even if you feel better
- Do not share antibiotics or take leftover antibiotics
- Side effects may include upset stomach, diarrhea, rash
- Call your doctor if you have a severe allergic reaction`
  },
  {
    name: "28-Vaccination-Schedule.md",
    title: "Vaccination Schedule",
    content: `# Vaccination Schedule

## Overview
Recommended vaccinations by age group.

## Key Information
- Vaccines prevent serious diseases
- Follow recommended schedules for best protection

## Important Guidelines
- Infants/children: multiple vaccines starting at birth
- Adolescents: Tdap, HPV, meningococcal
- Adults: annual flu, Tdap/Td every 10 years, shingles at 50+, COVID as recommended
- Travel vaccines may be needed depending on destination
- Keep a vaccination record
- Ask your provider what vaccines you need`
  },
  {
    name: "29-Surgery-Preparation-Guide.md",
    title: "Surgery Preparation Guide",
    content: `# Surgery Preparation Guide

## Overview
How to prepare for surgery.

## Key Information
- Proper preparation helps reduce complications
- Follow your surgeon's specific instructions carefully

## Important Guidelines
- Ask your surgeon any questions you have
- Provide a complete list of medications/supplements you take
- You may need to stop certain medications before surgery
- Do not eat/drink after midnight before surgery (NPO instructions)
- Arrange for someone to drive you home and help you after surgery
- Plan ahead for your recovery at home`
  },
  {
    name: "30-Post-Operative-Care-Manual.md",
    title: "Post-Operative Care Manual",
    content: `# Post-Operative Care Manual

## Overview
How to care for yourself after surgery.

## Key Information
- Follow your surgeon's instructions for recovery
- Recovery time varies depending on the surgery

## Important Guidelines
- Keep incision clean and dry
- Watch for signs of infection: redness, swelling, increasing pain, pus, fever
- Take pain medications as prescribed
- Gradually resume activity as directed
- Attend all follow-up appointments
- Call your surgeon if you have any concerns`
  },
  {
    name: "31-Physical-Therapy-Handbook.md",
    title: "Physical Therapy Handbook",
    content: `# Physical Therapy Handbook

## Overview
Information about physical therapy.

## Key Information
- Physical therapy helps improve movement, strength, and function
- Used after injury, surgery, or for chronic conditions

## Important Guidelines
- Attend all physical therapy appointments
- Do home exercises as prescribed
- Communicate with your therapist about pain or progress
- Be consistent for best results
- Ask questions if you don't understand an exercise`
  },
  {
    name: "32-Rehabilitation-Guidelines.md",
    title: "Rehabilitation Guidelines",
    content: `# Rehabilitation Guidelines

## Overview
Guidelines for rehabilitation after injury or illness.

## Key Information
- Rehabilitation helps regain function and independence
- Team may include physical therapists, occupational therapists, speech therapists

## Important Guidelines
- Set realistic goals with your care team
- Be patient with yourself
- Keep up with your therapy program
- Communicate openly with your providers
- Focus on what you can do, not just what you can't`
  },
  {
    name: "33-Pain-Management-Guide.md",
    title: "Pain Management Guide",
    content: `# Pain Management Guide

## Overview
Information about managing pain.

## Key Information
- Pain can be acute (short-term) or chronic (long-term)
- There are many approaches to pain management

## Important Guidelines
- Work with your doctor to find the right approach
- Options include: medications, physical therapy, heat/cold, acupuncture, massage, mindfulness
- For chronic pain, focus on improving function as well as reducing pain
- Follow directions for pain medications carefully
- Don't hesitate to ask for help with pain`
  },
  {
    name: "34-Nutrition-Therapy-Manual.md",
    title: "Nutrition Therapy Manual",
    content: `# Nutrition Therapy Manual

## Overview
Guidelines for healthy nutrition.

## Key Information
- Good nutrition is essential for health and healing
- Many conditions can be managed with dietary changes

## Important Guidelines
- Eat a variety of fruits and vegetables daily
- Choose whole grains over refined grains
- Include lean proteins
- Limit added sugars, sodium, and saturated fats
- Stay hydrated
- Consider working with a dietitian for personalized advice
- Nutrition needs change with age and health status`
  },
  {
    name: "35-Emergency-Treatment-Procedures.md",
    title: "Emergency Treatment Procedures",
    content: `# Emergency Treatment Procedures

## Overview
What to do in medical emergencies.

## Key Information
- Stay calm
- Call 911 for emergencies
- Act quickly but safely

## Important Guidelines
- For CPR/First Aid, get trained if possible
- For severe bleeding: apply firm, direct pressure
- For choking: perform abdominal thrusts (Heimlich) if person can't speak/cough/breathe
- For suspected heart attack/stroke: call 911 immediately
- Do not move a person with suspected spinal injury
- Provide emergency responders with information about what happened`
  },

  // Hospital Policy (36-45)
  {
    name: "36-Patient-Admission-Policy.md",
    title: "Patient Admission Policy",
    content: `# Patient Admission Policy

## Overview
Our hospital's patient admission procedures.

## Key Information
- Admission may be elective (scheduled) or emergency
- Be prepared with necessary information

## Important Guidelines
- Bring photo ID, insurance card, list of medications
- Be prepared to provide medical history and allergies
- Ask about what to bring (and what not to bring)
- One or two support people may stay with you depending on hospital policy
- Ask about visiting hours and any restrictions`
  },
  {
    name: "37-Patient-Discharge-Policy.md",
    title: "Patient Discharge Policy",
    content: `# Patient Discharge Policy

## Overview
Our hospital's patient discharge procedures.

## Key Information
- Discharge planning begins early to ensure safe transition home

## Important Guidelines
- Ask for written discharge instructions
- Understand any new medications
- Know follow-up appointment schedule
- Arrange for transportation home
- Have someone available to help at home if needed
- Ask questions if you don't understand anything
- Know who to call if you have problems after discharge`
  },
  {
    name: "38-Medical-Record-Management.md",
    title: "Medical Record Management",
    content: `# Medical Record Management

## Overview
How medical records are managed.

## Key Information
- Your medical record is a legal document
- It contains your health history, test results, and treatment plans

## Important Guidelines
- You have the right to access your medical records
- You may request copies
- You may request corrections to inaccurate information
- Records are kept confidential
- Ask your provider's office about their process for accessing records`
  },
  {
    name: "39-Infection-Control-Policy.md",
    title: "Infection Control Policy",
    content: `# Infection Control Policy

## Overview
Our hospital's infection control policies.

## Key Information
- Our top priority is keeping patients and staff safe from infections

## Important Guidelines
- Wash hands frequently or use hand sanitizer
- Follow isolation precautions as instructed
- Stay home if you're sick
- Get recommended vaccinations
- Cough/sneeze into your elbow
- Keep immunizations up to date`
  },
  {
    name: "40-ICU-Procedures-Manual.md",
    title: "ICU Procedures Manual",
    content: `# ICU Procedures Manual

## Overview
What to expect in the Intensive Care Unit (ICU).

## Key Information
- The ICU provides 24/7 specialized care for critically ill patients
- Staffing ratios are lower, with more one-on-one care

## Important Guidelines
- Ask the care team to explain what's happening
- Keep visits calm and quiet
- Check with staff before bringing food or gifts
- Only healthy visitors should come
- Ask about sleep plans to help the patient rest
- Don't hesitate to ask questions of the care team`
  },
  {
    name: "41-Emergency-Room-Protocols.md",
    title: "Emergency Room Protocols",
    content: `# Emergency Room Protocols

## Overview
What to expect in the Emergency Department (ER).

## Key Information
- ERs prioritize patients by severity (triage), not arrival time
- Be prepared for waiting depending on how busy the ER is

## Important Guidelines
- Bring a list of medications, allergies, and medical history
- Be honest about what happened
- Explain symptoms clearly
- Ask questions
- If your condition worsens while waiting, tell staff immediately
- Ask about discharge instructions and follow-up care`
  },
  {
    name: "42-Patient-Rights-Document.md",
    title: "Patient Rights Document",
    content: `# Patient Rights Document

## Overview
Your rights as a patient.

## Key Information
- You have rights regarding your medical care and treatment

## Important Guidelines
- You have the right to:
  - Respectful care
  - Be informed about your condition and treatment
  - Ask questions and get clear answers
  - Make decisions about your care (informed consent)
  - Refuse treatment
  - Privacy and confidentiality
  - Access your medical records
  - Be free from discrimination
  - Have pain managed
  - File a complaint if you're unhappy with your care`
  },
  {
    name: "43-Privacy-and-HIPAA-Guidelines.md",
    title: "Privacy and HIPAA Guidelines",
    content: `# Privacy and HIPAA Guidelines

## Overview
HIPAA (Health Insurance Portability and Accountability Act) protects your health information.

## Key Information
- HIPAA ensures your health information is kept private and secure
- Your health information cannot be shared without your permission, except as allowed by law

## Important Guidelines
- You will receive a Notice of Privacy Practices from your providers
- You may request restrictions on how your information is used
- You may file a complaint if you believe your privacy rights have been violated
- Ask your provider's privacy officer if you have questions`
  },
  {
    name: "44-Hospital-Safety-Procedures.md",
    title: "Hospital Safety Procedures",
    content: `# Hospital Safety Procedures

## Overview
Our hospital's safety procedures.

## Key Information
- Patient safety is our top priority

## Important Guidelines
- Ask staff to identify themselves before accepting care
- Ask questions about any procedure or medication
- Keep your bed in low position when sleeping
- Use call light if you need help
- Report any safety concerns to staff immediately
- Hand hygiene is for everyone - staff, patients, visitors
- Don't be afraid to speak up about safety`
  },
  {
    name: "45-Telemedicine-Guidelines.md",
    title: "Telemedicine Guidelines",
    content: `# Telemedicine Guidelines

## Overview
How to use telemedicine (virtual care).

## Key Information
- Telemedicine lets you see your provider remotely via phone or video
- Good for follow-ups, medication management, and some urgent issues

## Important Guidelines
- Check if your insurance covers telemedicine
- Make sure you have a good internet connection for video visits
- Find a quiet, private place for your visit
- Have a list of questions ready
- Have your medication list handy
- Ask about next steps and if you need an in-person visit`
  },

  // Insurance & Admin (46-50)
  {
    name: "46-Health-Insurance-Claims-Guide.md",
    title: "Health Insurance Claims Guide",
    content: `# Health Insurance Claims Guide

## Overview
How health insurance claims work.

## Key Information
- Your insurance may cover some or all of your medical costs
- Understanding your policy helps avoid surprises

## Important Guidelines
- Understand your plan's deductibles, copays, and coinsurance
- Stay in network if possible to reduce costs
- Ask for preauthorization for certain procedures/treatments
- Keep records of all medical bills and explanations of benefits (EOBs)
- If a claim is denied, you have the right to appeal
- Ask your provider's billing department or insurance company for help`
  },
  {
    name: "47-Insurance-Coverage-Policies.md",
    title: "Insurance Coverage Policies",
    content: `# Insurance Coverage Policies

## Overview
Understanding your health insurance coverage.

## Key Information
- Health insurance plans vary widely in what they cover

## Important Guidelines
- Read your policy documents carefully
- Know your in-network providers and facilities
- Understand which services are covered and which require prior approval
- Ask about prescription drug coverage
- Know your annual out-of-pocket maximum
- Ask your insurance company or employer's HR department if you have questions`
  },
  {
    name: "48-Billing-Procedures-Manual.md",
    title: "Billing Procedures Manual",
    content: `# Billing Procedures Manual

## Overview
Our hospital's billing procedures.

## Key Information
- We are committed to transparent billing

## Important Guidelines
- You will receive an itemized bill after services
- Review your bill carefully
- Compare it to your explanation of benefits (EOB) from insurance
- Ask for help if you don't understand something
- We offer payment plans for those who qualify
- Ask about financial assistance programs if needed
- Contact our billing department with questions or concerns`
  },
  {
    name: "49-Healthcare-Compliance-Guide.md",
    title: "Healthcare Compliance Guide",
    content: `# Healthcare Compliance Guide

## Overview
Our commitment to healthcare compliance.

## Key Information
- We follow all federal, state, and local healthcare laws and regulations
- This includes HIPAA, billing laws, and quality standards

## Important Guidelines
- We are committed to ethical billing practices
- We are committed to providing quality care
- We encourage patients to ask questions about their care and billing
- We have policies in place to protect patient privacy
- We comply with all licensing and accreditation requirements`
  },
  {
    name: "50-Government-Health-Programs-Guide.md",
    title: "Government Health Programs Guide",
    content: `# Government Health Programs Guide

## Overview
Information about government health programs.

## Key Information
- There are several government programs that help with healthcare costs

## Important Guidelines
- Medicare: for people 65+ and some younger people with disabilities
- Medicaid: for low-income individuals and families
- CHIP: Children's Health Insurance Program for kids
- Affordable Care Act (ACA) marketplaces: for people who don't have employer insurance
- Eligibility and benefits vary by program and state
- Visit healthcare.gov or your state's health department website for more information`
  }
];

console.log(`Generating ${documentData.length} healthcare documents...`);

documentData.forEach((doc, index) => {
  const filePath = path.join(docsDir, doc.name);
  fs.writeFileSync(filePath, doc.content, 'utf8');
  console.log(`✓ Created: ${doc.name}`);
});

console.log('\n🎉 All healthcare documents generated successfully!');
