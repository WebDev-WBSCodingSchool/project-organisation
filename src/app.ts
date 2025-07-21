import express, { type RequestHandler } from 'express';
import mongoose, { Schema, model } from 'mongoose';

type UserType = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  isActive?: boolean;
};

type PostType = {
  title: string;
  content: string;
  userId: string;
};

try {
  await mongoose.connect(process.env.MONGO_URI!, {
    dbName: 'blog'
  });
  console.log('\x1b[35mMongoDB connected via Mongoose\x1b[0m');
} catch (error) {
  console.error('MongoDB connection error:', error);
  process.exit(1);
}

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email is not valid']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
      minlength: [6, 'Password must be at least 6 characters long']
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

const postSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required']
    }
  },
  {
    timestamps: true
  }
);

const User = model('User', userSchema);
const Post = model('Post', postSchema);

const getUsers: RequestHandler = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
};

const createUser: RequestHandler = async (req, res) => {
  try {
    const { firstName, lastName, email, password, isActive } = req.body as UserType;
    if (!firstName || !lastName || !email || !password)
      return res.status(400).json({ error: 'firstName, lastName, email, and password are required' });
    const found = await User.findOne({ email });
    if (found) return res.status(400).json({ error: 'User already exists' });
    const user = await User.create<UserType>({ firstName, lastName, email, password, isActive });
    res.json(user);
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
};

const getUserById: RequestHandler = async (req, res) => {
  try {
    const {
      params: { id }
    } = req;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
};

const updateUser: RequestHandler = async (req, res) => {
  try {
    const {
      body,
      params: { id }
    } = req;
    const { firstName, lastName, email } = body as UserType;
    if (!firstName || !lastName || !email)
      return res.status(400).json({ error: 'firstName, lastName, and email are required' });
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.firstName = firstName;
    user.lastName = lastName;
    user.email = email;
    await user.save();
    res.json(user);
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
};

const deleteUser: RequestHandler = async (req, res) => {
  try {
    const {
      params: { id }
    } = req;
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
};

const getPosts: RequestHandler = async (req, res) => {
  try {
    const posts = await Post.find().populate('userId', 'firstName lastName email').lean();
    res.json(posts);
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
};

const createPost: RequestHandler = async (req, res) => {
  try {
    const { title, content, userId } = req.body as PostType;
    if (!title || !content || !userId)
      return res.status(400).json({ error: 'title, content, and userId are required' });
    const post = await Post.create<PostType>({ title, content, userId });
    const populatedPost = await post.populate('userId', 'firstName lastName email');
    res.json(populatedPost);
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
};

const getPostById: RequestHandler = async (req, res) => {
  try {
    const {
      params: { id }
    } = req;
    const post = await Post.findById(id).populate('userId', 'firstName lastName email');
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
};

const updatePost: RequestHandler = async (req, res) => {
  try {
    const {
      body: { title, content, userId },
      params: { id }
    } = req;
    if (!title || !content || !userId)
      return res.status(400).json({ error: 'title, content, and userId are required' });

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    post.title = title;
    post.content = content;
    post.userId = userId;
    await post.save();

    const populatedPost = await post.populate('userId', 'firstName lastName email');
    res.json(populatedPost);
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
};

const deletePost: RequestHandler = async (req, res) => {
  try {
    const {
      params: { id }
    } = req;
    const post = await Post.findByIdAndDelete(id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json({ message: 'Post deleted' });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred' });
    }
  }
};

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());

app.get('/users', getUsers);
app.post('/users', createUser);
app.get('/users/:id', getUserById);
app.put('/users/:id', updateUser);
app.delete('/users/:id', deleteUser);
app.get('/posts', getPosts);
app.post('/posts', createPost);
app.get('/posts/:id', getPostById);
app.put('/posts/:id', updatePost);
app.delete('/posts/:id', deletePost);

app.listen(port, () => console.log(`\x1b[34mMain app listening at http://localhost:${port}\x1b[0m`));
