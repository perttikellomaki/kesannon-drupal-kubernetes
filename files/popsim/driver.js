$(function() {

    var round;
    var population;
    var data;
    var allele_averages = false;
    var stats;
    var totalPoints;
    var plot;
    var running = false;
    var initialization_period = 0;

    function resetAlleleAverages () {
	allele_averages = [];
	for (var i = 0; i < totalPoints; i++) {
	    allele_averages.push([]);
	}
    }
    
    function init() {
	$('#extinctalleles').text('');
	round = 0;
	population = createFounders();

	// run some time while preserving allele distributio
	for (var i = 0; i < initialization_period; i++) {
	    oneRound(population, true);
	}

	data = {};
	stats = statistics(population).distribution;
	console.log("initial statistics " + JSON.stringify(stats))
	for (var p in stats) {
	    data[p] = [stats[p]];
	}
	totalPoints = 100;

	if (!allele_averages) {
	    resetAlleleAverages();
	}

	var d = getRandomData();
	//console.log("d: " + JSON.stringify(d))
	plot = $.plot("#placeholder", d, {
	    series: {
		shadowSize: 0	// Drawing is faster without shadows
	    },
	    yaxis: {
		min: 0,
		max: 2*initial_population_size
	    },
	    xaxis: {
		min: 0, max: 100
	    }
	});
	var av = getAverageData();
	avplot = $.plot("#average-placeholder", av, {
	    series: {
		shadowSize: 0	// Drawing is faster without shadows
	    },
	    yaxis: {
		min: 0,
		max: alleles + 1
	    },
	    xaxis: {
		min: 0, max: 100
	    }
	});

    }

    function stop () {
   	running = !running;
    } 	

    function oneRound (population, preserve_alleles) {
	agePopulation(population);
	if (!preserve_alleles) {
	    insertMatadorMatings(population);
	}
	var new_litters = Math.floor((initial_population_size - (population.males.length + population.females.length)) / 8);
	for (var i = 0; i < new_litters; i++) {
	    procreate(population, preserve_alleles);
	}
    }

    function zip (lst) {
	var res = [];
	for (var i = 0; i < lst.length; i++) {
	    res.push([i, lst[i]]);
	}
	return res;
    }

    function getAverageData () {
	var sums = [];
	for (var i = 0; i < totalPoints; i++) {
	    sums.push(0);
	    for (var j = 0; j < allele_averages[i].length; j++) {
		sums[i] = sums[i] + allele_averages[i][j];
	    }
	    sums[i] = sums[i] / allele_averages[i].length;
	}
	return [{data: zip(sums), label: "Haplotyyppien lkm"}];
    }

    function getRandomData() {
	var prev_distribution = statistics(population).distribution;
	oneRound(population);
	var stats = statistics(population);
	var distribution = stats.distribution;
	allele_averages[round].push(stats.distinct_alleles);
	for (var p in data) {
	    if (prev_distribution[p] == 0 && distribution[p] > 0) {
		console.log("allele " + p + " reappeared")
		console.log(JSON.stringify(prev_distribution))
		console.log(JSON.stringify(distribution))
		statistics(population, p)
		for (var i = 0; i < population.males; i++) {
		    var individual = population.males[i];
		    if (individual.genotype[0] == p || individual.genotype[1] == p) {
			console.log(JSON.stringify(individual));
		    }
		}
		for (var i = 0; i < population.females; i++) {
		    var individual = population.females[i];
		    if (individual.genotype[0] == p || individual.genotype[1] == p) {
			console.log(JSON.stringify(individual));
		    }
		}
	    }
	    if (distribution[p] == 0 && prev_distribution[p] > 0) {
		var year = population.year - initialization_period;
		$('#extinctalleles').append("parta " + (parseInt(p) + 1) + " hävisi vuonna " + year + ", ");
	    }
	    if (round > totalPoints) {
		if (data[p].length > 0) {
		    data[p].splice(0, 1);
		}
	    }
	}
	for (var p in distribution) {
	    if (distribution[p] > 0) {
		data[p].push(distribution[p]);
	    }
	}

	round++;

	var res = [];
	for (var p in data) {
	    res.push({ data: zip(data[p]), label: 'parta' + (parseInt(p) + 1) });
	}
	
	//console.log(JSON.stringify(res))
	return res;
    }

    $(document).on('click', "#startbutton", function(){ running = true; init(); update();});
    $(document).on('click', "#resetbutton", function(){ 
	resetAlleleAverages()
	avplot.setData(getAverageData());
	avplot.draw();
    });

    var updateInterval = 50;
    $("#sireLitters").val(sireLitters).change(function () {
	var v = $(this).val();
	if (v && !isNaN(+v)) {
	    sireLitters = +v;
	    if (sireLitters < 1) {
		sireLitters = 1;
	    } else if (sireLitters > 20) {
		sireLitters = 20;
	    }
	    $(this).val("" + sireLitters);
	}
    });

    $("#damLitters").val(damLitters).change(function () {
	var v = $(this).val();
	console.log("damLitters")
	console.log(v)
	if (v && !isNaN(+v)) {
	    damLitters = +v;
	    if (damLitters < 1) {
		damLitters = 1;
	    } else if (damLitters > 20) {
		damLitters = 20;
	    }
	    $(this).val("" + damLitters);
	}
    });

    $("#matadorInterval").val(matadorInterval).change(function () {
	var v = $(this).val();
	console.log(v)
	if (v && !isNaN(+v)) {
	    matadorInterval = +v;
	    if (matadorInterval < 1) {
		matadorInterval = 1;
	    }
	    $(this).val("" + matadorInterval);
	}
    });
    $("#matadorDuration").val(matadorDuration).change(function () {
	var v = $(this).val();
	if (v && !isNaN(+v)) {
	    matadorDuration = +v;
	    if (matadorDuration < 1) {
		matadorDuration = 1;
	    } else if (matadorDuration > 8) {
		matadorDuration = 8;
	    }
	    $(this).val("" + matadorDuration);
	}
    });
    $("#matadorLittersPerYear").val(matadorLittersPerYear).change(function () {
	var v = $(this).val();
	if (v && !isNaN(+v)) {
	    matadorLittersPerYear = +v;
	    if (matadorLittersPerYear < 1) {
		matadorLittersPerYear = 1;
	    }
	    $(this).val("" + matadorLittersPerYear);
	}
    });

    init();
    function update() {

	plot.setData(getRandomData());
	plot.draw();
	if (running && round < 100) {
            setTimeout(update, updateInterval);
        } else {
	    avplot.setData(getAverageData());
	    avplot.draw();
	}

    }


    // Add the Flot version string to the footer

    $("#footer").prepend("Flot " + $.plot.version + " &ndash; ");
});

