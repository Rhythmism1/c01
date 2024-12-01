import { NextApiRequest, NextApiResponse } from "next";
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

const uri = process.env.MONGODB_URI!;
const client = new MongoClient(uri);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await client.connect();
    const database = client.db('your-database-name');
    const users = database.collection('users');

    const { email, password, action } = req.body;

    // Registration
    if (action === 'register') {
      const existingUser = await users.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await users.insertOne({
        email,
        password: hashedPassword,
      });

      return res.status(201).json({ message: 'User created successfully' });
    }

    // Login
    if (action === 'login') {
      const user = await users.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      if (isValidPassword) {
        return res.status(200).json({ 
          success: true,
          user: {
            id: user._id,
            email: user.email
          }
        });
      }

      return res.status(200).json({ 
        success: true,
        user: {
          id: user._id,
          email: user.email
        }
      });
    }

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  } finally {
    await client.close();
  }
}