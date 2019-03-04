class Spikey_Agent {
    constructor() {
        
    }

    static new_agent(agent_type) {
        if (agent_type == CHAOS_AGENT)
            return new Chaos_Agent();

        return new Null_Agent();
    }

    get_actuation() {
        return [0, 0, 0, 0,
                0, 0, 0, 0,
                0, 0, 0, 0];
    }
}

class Null_Agent {
    constructor() {
        
    }

    get_actuation() {
        return [0, 0, 0, 0,
                0, 0, 0, 0,
                0, 0, 0, 0];
    }
}

class Chaos_Agent extends Spikey_Agent {

    get_actuation(state) {
        var t = state.t;

        var actuation = Array.apply(null, Array(num_spikes));
        for (var i in actuation)
            actuation[i] = Math.cos(.4/100*t + i*2)*20;
        return actuation;
    }
}