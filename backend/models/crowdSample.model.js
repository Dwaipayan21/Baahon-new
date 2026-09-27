import mongoose from "mongoose";

const crowdSampleSchema = new mongoose.Schema(
  {
    pandalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pandal",
      required: true,
      index: true,
    },

    samplePointId: {
      type: String,
      required: true,
      index: true,
    },

    samplePointName: {
      type: String,
      required: true,
    },

    congestionLevel: {
      type: String,
      enum: ["NORMAL", "SLOW", "TRAFFIC_JAM", "UNKNOWN"],
      required: true,
    },

    congestionScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },

    durationSeconds: {
      type: Number,
      default: null,
    },

    staticDurationSeconds: {
      type: Number,
      default: null,
    },

    trafficRatio: {
      type: Number,
      default: null,
    },

    source: {
      type: String,
      enum: ["google"],
      default: "google",
    },

    observedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

crowdSampleSchema.index({
  pandalId: 1,
  observedAt: -1,
});

crowdSampleSchema.index(
  { observedAt: 1 },
  { expireAfterSeconds: 86400 } //24 hours cause aggregations only considers recent observations
);

const CrowdSample = mongoose.model(
  "CrowdSample",
  crowdSampleSchema
);

export default CrowdSample;