class Noise {

    /**
     * @param conf Object
     *      conf.initialStddev: 0.1 default // σ
     *      conf.desiredActionStddev: 0.1 default // δ
     *      conf.adoptionCoefficient: 1.01 default // α
     */
    constructor(conf){
        conf = conf || {};
        this.initialStddev = conf.initialStddev || 0.5;
        this.desiredActionStddev = conf.desiredActionStddev || 0.5;
        this.adoptionCoefficient = conf.adoptionCoefficient || 1.01;
        this.currentStddev = this.initialStddev;
    }

    /**
     * The distance from the Adaptive scaling
     * @param distance number
     */
    adapt(distance){
        if (distance > this.desiredActionStddev){
            this.currentStddev /= this.adoptionCoefficient;
        }
        else{
            this.currentStddev *= this.adoptionCoefficient;
        }
    }
};