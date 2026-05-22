import mongoose from 'mongoose';
import bcrypt from 'bcryptjs'; // Import bcryptjs for password hashing

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: function() {
        return !this.googleId; // Password is required if googleId is not provided
      }
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple documents to have null googleId
    },
    preferredRole: {
      type: String,
      default: 'Software Engineer',
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Pre-save middleware to hash the password before saving the user document
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return ; // If password is not modified, skip hashing
  }
  const salt = await bcrypt.genSalt(10); // Generate a salt with 10 rounds, It is added to the password before hashing to make it more secure and resistant to rainbow table attacks. The higher the number of rounds, the more secure but also more computationally expensive the hashing process will be.
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare entered password with the hashed password in the database
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) {
    return false; // If there is no password (e.g., for Google users), return false
  }f
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;