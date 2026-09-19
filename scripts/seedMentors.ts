import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../src/models/User';
import { connectDB } from '../src/db/db';

dotenv.config();

export async function seedMentors(): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    if (mongoose.connection.readyState !== 1) {
      console.warn('[Seed Mentors] MongoDB is not connected. Skipping mentor seed.');
      return;
    }

    // 1. Ensure Atharva Pande (scoe@gmail.com) has active mentor availability and profile info
    const atharva = await User.findOne({ email: 'scoe@gmail.com' });
    if (atharva) {
      let shouldUpdate = false;
      if (!atharva.isMentorAvailable) {
        atharva.isMentorAvailable = true;
        shouldUpdate = true;
      }
      if (!atharva.mentorAreas || atharva.mentorAreas.length === 0) {
        atharva.mentorAreas = ['Distributed Systems', 'Cloud Architecture', 'System Design', 'DevOps & Kubernetes'];
        shouldUpdate = true;
      }
      if (!atharva.mentorshipTypes || atharva.mentorshipTypes.length === 0) {
        atharva.mentorshipTypes = ['Live Projects', 'Internships', 'Research Projects'];
        shouldUpdate = true;
      }
      if (!atharva.bio) {
        atharva.bio = 'HOD Computer Science & Engineering. Passionate about guiding student engineers in scalable cloud systems, microservices, and system architecture design.';
        shouldUpdate = true;
      }
      if (!atharva.skills || atharva.skills.length === 0) {
        atharva.skills = ['Distributed Systems', 'Cloud Architecture', 'Kubernetes', 'Go', 'System Design'];
        shouldUpdate = true;
      }
      if (!atharva.industryExperience) {
        atharva.industryExperience = '12+ Years (Academic & Cloud Consulting)';
        shouldUpdate = true;
      }
      if (shouldUpdate) {
        await atharva.save();
        console.log('[Seed Mentors] Updated Atharva Pande as available mentor.');
      }
    }

    // 2. Add 2 more diverse faculty mentors if not already present
    const additionalMentors = [
      {
        email: 'priya.sharma@faculty.edu',
        name: 'Dr. Priya Sharma',
        role: 'academician' as const,
        college: 'Sanjivani College of Engineering, Kopargaon',
        collegeName: 'Sanjivani College of Engineering, Kopargaon',
        department: 'Artificial Intelligence & Data Science',
        designation: 'Associate Professor',
        isMentorAvailable: true,
        mentorAreas: ['Machine Learning & AI', 'Computer Vision', 'Natural Language Processing'],
        mentorshipTypes: ['Research Projects', 'Innovation Challenges', 'Live Projects'],
        skills: ['Machine Learning', 'Deep Learning', 'PyTorch', 'Computer Vision', 'NLP'],
        bio: 'PhD in Applied Machine Learning. Leading the Autonomous Vision & NLP Lab. Mentors students for AI research publications, national hackathons, and ML engineering roles.',
        industryExperience: '8 Years (AI Research & Industry Collaboration)',
      },
      {
        email: 'rajesh.deshmukh@faculty.edu',
        name: 'Prof. Rajesh Deshmukh',
        role: 'academician' as const,
        college: 'Sanjivani College of Engineering, Kopargaon',
        collegeName: 'Sanjivani College of Engineering, Kopargaon',
        department: 'Information Technology',
        designation: 'Assistant Professor & Lab Lead',
        isMentorAvailable: true,
        mentorAreas: ['Full-Stack Web', 'Cybersecurity & Cryptography', 'Data Engineering'],
        mentorshipTypes: ['Live Projects', 'Internships', 'Industry Programs'],
        skills: ['Full-Stack Web', 'Node.js / React', 'Application Security', 'Database Design', 'PostgreSQL'],
        bio: 'Specialist in full-stack enterprise engineering and zero-trust web application security. Guides students on production web architectures and industry internship readiness.',
        industryExperience: '6 Years (Full-Stack Architecture & Security Audits)',
      },
    ];

    for (const mentorData of additionalMentors) {
      const existing = await User.findOne({ email: mentorData.email });
      if (!existing) {
        const hashedPassword = await bcrypt.hash('Mentor@1234', 10);
        await User.create({
          ...mentorData,
          password: hashedPassword,
        });
        console.log(`[Seed Mentors] Seeded faculty mentor: ${mentorData.name}`);
      }
    }
  } catch (err: any) {
    console.error('[Seed Mentors] Error seeding mentors:', err.message || err);
  }
}
