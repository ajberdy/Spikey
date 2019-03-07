initMetrics("statContainer", ["Reward", "ActorLoss", "CriticLoss", "EpisodeDuration", "NoiseDistance"]);

var scene = Training_Scene();
var agent = new Agent(scene);
agent.train();