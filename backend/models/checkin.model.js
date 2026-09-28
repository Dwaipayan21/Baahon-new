import mongoose from "mongoose";

const checkInSchema = new mongoose.Schema(
  {
    // Used as the user/device identifier until authentication is added.
    userId: {
      type: String,
      required: true,
      trim: true,
    },

    pandalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pandal",
      required: true,
    },

    // GeoJSON coordinates: [longitude, latitude].
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
        default: "Point",
      },

      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: (value) =>
            value.length === 2 &&
            Number.isFinite(value[0]) &&
            Number.isFinite(value[1]) &&
            value[0] >= -180 &&
            value[0] <= 180 &&
            value[1] >= -90 &&
            value[1] <= 90,
          message: "Coordinates must be [longitude, latitude]",
        },
      },
    },

    // Stores the category used when points were awarded.
    category: {
      type: String,
      required: true,
      trim: true,
    },

    points: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent the same user from checking into the same pandal twice.
checkInSchema.index(
  {
    userId: 1,
    pandalId: 1,
  },
  {
    unique: true,
  }
);

checkInSchema.index({
  pandalId: 1,
  createdAt: -1,
});

const CheckIn = mongoose.model("CheckIn", checkInSchema);

export default CheckIn;