var generation_size = 100;
var alleles = 7;
var allele_distribution = {0: 44.8,
			   1: 35.7,
			   2: 8.4, 
			   3: 5.2,
			   4: 2.6,
			   5: 2.6,
			   6: 0.7};
var max_age = 10;
var sire_min_age = 2;
var sire_max_age = 10;
var dam_min_age = 2;
var dam_max_age = 8;

var matadorInterval = 0;
var matadorAge = 2;
var matadorDuration = 0;
var matadorLittersPerYear = 0

var initial_population_size = generation_size * max_age;

/**
 * Returns a random integer between min and max
 * Using Math.round() will give you a non-uniform distribution!
 */
function getRandomInt (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createFounders () {
    var dog_id = 0;
    var initial_alleles = [];
    function generate (lst, sex) {
        for (var i  = 0; i < generation_size/2; i++) {
            founders = {};
            founders[dog_id] = 1;
	    var i1 = getRandomInt(0, initial_alleles.length - 1);
	    var a1 = initial_alleles[i1];
	    initial_alleles.splice(i1, 1);
	    var i2 = getRandomInt(0, initial_alleles.length - 1);
	    var a2 = initial_alleles[i2];
	    initial_alleles.splice(i2, 1);
            lst.push({sex: sex,
		      age: age, 
                      genotype: [a1, a2],
                      founders: founders,
                      inbreeding: 0,
		      litters: 0
                     });
            dog_id = dog_id + 1
	}
    }
    var allele_sum = 0;
    for (var a in allele_distribution) {
	allele_sum += allele_distribution[a];
    }
    for (var a in allele_distribution) {
	for (var i = 0; i < 2 * initial_population_size * (allele_distribution[a] / allele_sum); i++) {
	    initial_alleles.push("" + a);
	}
    }
    for (var i = initial_alleles.length; i < 2 * initial_population_size; i++) {
	initial_alleles.push("" + 0);
    }

    var gen = {males: [], females: [], year: 0}
    for (var age = 0; age < max_age; age++) {
	generate(gen.males, 'male');
	generate(gen.females, 'female')
    }
    return gen;
}

function mate (male, female) {
    function contribution (parent, founder_id) {
	if (parent.founders[founder_id] != undefined) {
	    return parent.founders[founder_id];
	} else {
	    return 0;
	}
    }

    var pup_founders = {};
    var pup_inbreeding = 0;
    var common_founders = {};

    for (var f in male.founders) {
	common_founders[f] = true;
    }
    for (var f in female.founders) {
	common_founders[f] = true;
    }

    for (var founder_id in common_founders) {
        pup_founders[founder_id] = 
	    0.5 * contribution(male, founder_id) 
	    + 0.5 * contribution(female, founder_id);
        pup_inbreeding = pup_inbreeding + contribution(male, founder_id) * contribution(female, founder_id);
    }
    ma = male.genotype[0];
    mb = male.genotype[1];
    fa = female.genotype[0];
    fb = female.genotype[1];

    var parent_info = {father_genotype: male.genotype, father_age: male.age, mother_genotype: female.genotype, mother_age: female.age}

    pups = [{age: 0, genotype: [ma, fa], founders: pup_founders, inbreeding: pup_inbreeding, parent_info: parent_info}, 
	    {age: 0, genotype: [ma, fa], founders: pup_founders, inbreeding: pup_inbreeding, parent_info: parent_info}, 
	    {age: 0, genotype: [ma, fb], founders: pup_founders, inbreeding: pup_inbreeding, parent_info: parent_info},
	    {age: 0, genotype: [ma, fb], founders: pup_founders, inbreeding: pup_inbreeding, parent_info: parent_info},
	    {age: 0, genotype: [mb, fa], founders: pup_founders, inbreeding: pup_inbreeding, parent_info: parent_info},
	    {age: 0, genotype: [mb, fa], founders: pup_founders, inbreeding: pup_inbreeding, parent_info: parent_info},
	    {age: 0, genotype: [mb, fb], founders: pup_founders, inbreeding: pup_inbreeding, parent_info: parent_info},
	    {age: 0, genotype: [mb, fb], founders: pup_founders, inbreeding: pup_inbreeding, parent_info: parent_info}];

    var males = [];
    for (var i = 7; i > 3; i--) {
	male = getRandomInt(0, i);
	pups[male].sex = 'male';
	males.push(pups[male]);
	pups.splice(male, 1);
    }
    for (var i = 0; i < 4; i++) {
	pups[i].sex = 'female';
    }
    return {males: males, females: pups};
}

var father_queue = {}
var dam_queue = {}

// how many litters per sire or dam
var sireLitters = 1;
var damLitters = 1;

function insertMatadorMatings (population) {
    var year = population.year;
    if (year % matadorInterval == 0) {
	var matador = pickRandom(population.males,
				 function (male) { return male.age == matadorAge; })
	for (var offset = 0; offset < matadorDuration; offset++) {
	    var y = year + offset;
	    for (var matings = 0; matings < matadorLittersPerYear; matings++) {
		if (father_queue[y] == undefined) {
		    father_queue[y] = [matador];
		} else {
		    father_queue[y].splice(0, 0, matador);
		}
	    }
	}
    }
}

function pickRandom (individuals, pred) {
    var candidate = false;
    var idx = getRandomInt(0, individuals.length - 1);
    for (var offset = 0; offset < individuals.length; offset++) {
	candidate = individuals[(idx + offset) % individuals.length];
	if (pred(candidate)) {
	    return candidate;
	}
    }
    return false;
}

function oneMating (generation, preserve_alleles) {
    //    console.log("mate " + male_index + " and " + female_index);
    //console.log(JSON.stringify(generation.males))
    //console.log(JSON.stringify(generation.females))

    function pickParent (parent_queue, individuals, litters, pred) {
	var parent = false;
	if (parent_queue[generation.year] != undefined) {
	    var queue = parent_queue[generation.year];
	    for (var i = 0; i < queue.length; i++) {
		if (!pred(queue[i]) || queue[i].age >= max_age) {
		    queue.splice(i, 1);
		} else {
		    parent = queue[i];
		    queue.splice(i, 1);
		    break;
		}
	    }
	}
	if (!parent) {
	    parent = pickRandom(individuals, pred);
	    if (parent) {
		for (var i = 1; i < litters; i++) {
		    var year = generation.year;
		    if (parent_queue[year + i] == undefined) {
			parent_queue[year + i] = [parent];
		    } else {
			parent_queue[year + i].push(parent);
		    }
		}
	    }
	}
	return parent;
    }

    var male = false;
    if (preserve_alleles) {
	var distribution = statistics(generation).distribution;
	var most_infrequent_allele = -1;
	var most_infrequent_count = initial_population_size;
	for (var p in distribution) {
	    if (distribution[p] > 0 && distribution[p] < most_infrequent_count) {
		most_infrequent_count = distribution[p] / allele_distribution[p];
		most_infrequent_allele = p;
	    }
	}
	var male_index = getRandomInt(0, generation.males.length - 1);
	for (var offset = 0; offset < generation.males.length; offset++) {
	    var candidate = generation.males[(male_index + offset) % generation.males.length];
	    //console.log("candidate " + JSON.stringify(candidate))
	    if (candidate.genotype[0] == most_infrequent_allele
		|| candidate.genotype[1] == most_infrequent_allele) 
	    {
		male = candidate;
		//console.log("most infrequent " + most_infrequent_allele + " count " +  most_infrequent_count + " pick " + JSON.stringify(male));
		break;
	    }
	}
    }
    if (!male) {
	male = pickParent(father_queue, generation.males, sireLitters,
			  function (male) {return (sire_min_age <= male.age && male.age <= sire_max_age); });
    }

    if (preserve_alleles) {
	var female_index = getRandomInt(0, generation.females.length - 1);
	var female  = generation.females[female_index];
    } else {
	female = pickParent(dam_queue, generation.females, damLitters,
			    function (female) {return (dam_min_age <= female.age && female.age <= dam_max_age); });
    }

    return mate(male, female);
}

function age (n, individuals) {
    individuals[n].age = individuals[n].age + 1;
    if (individuals[n].age >= max_age) {
        individuals.splice(n, 1);
    }
}

function agePopulation (generation) {
    var males_len = generation.males.length;
    var females_len = generation.females.length;
    for (var i = males_len - 1; i >= 0; i--) {
        age(i, generation.males);
    }
    for (var i = females_len - 1; i >= 0; i--) {
        age(i, generation.females);
    }
    generation.year = generation.year + 1;
}

function procreate (generation, preserve_alleles) {
    var new_individuals = oneMating(generation, preserve_alleles);
    for (var n in new_individuals.males) {
	generation.males.push(new_individuals.males[n]);
    }
    for (var n in new_individuals.females) {
	generation.females.push(new_individuals.females[n]);
    }
}

function statistics (generation, debug_allele) {
    var distribution = {};
    var distinct_alleles = 0;

    function process (individual) {
        var gt = individual.genotype;
	if (debug_allele && (debug_allele == gt[0] || debug_allele == gt[1])) {
	    console.log("allele " + debug_allele + " found in " + JSON.stringify(individual))
	}
        distribution[gt[0]] = distribution[gt[0]] + 1;
        distribution[gt[1]] = distribution[gt[1]] + 1;
    }

    for (var a in allele_distribution) {
	distribution[a] = 0;
    }

    for (var i = 0; i < generation.males.length; i++) {
        process(generation.males[i]);
    }
    for (var i = 0; i < generation.females.length; i++) {
        process(generation.females[i]);
    }

    for (var a in distribution) {
	if (distribution[a] > 0) {
	    distinct_alleles++;
	}
    }

    return {distribution: distribution, distinct_alleles: distinct_alleles};
}

function printPop (gen) {
    for (var i in gen.males) {
	console.log(JSON.stringify(gen.males[i]));
    }
    for (var i in gen.females) {
	console.log(JSON.stringify(gen.females[i]));
    }
}

/*
var gen = createFounders();
for (m in gen.males) {
    console.log(JSON.stringify(gen.males[m]));
}
for (m in gen.females) {
    console.log(JSON.stringify(gen.females[m]));
}
mate(gen.males[0], gen.females[0])
*/
