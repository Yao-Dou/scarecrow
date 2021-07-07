/**
 * Map from selection id (e.g., "selection-0") to the Characters
 */


// function readTextFile(file)
//     {
//         var rawFile = new XMLHttpRequest();
//         rawFile.open("GET", file, false);
//         rawFile.onreadystatechange = function ()
//         {
//             if(rawFile.readyState === 4)
//             {
//                 if(rawFile.status === 200 || rawFile.status == 0)
//                 {
//                     var allText = rawFile.responseText;
//                 }
//             }
//         }
//         rawFile.send(null);
//     }

var filename = "https://raw.githubusercontent.com/Yao-Dou/scarecrow/main/data/grouped_data.csv"

let original_ontologies = ["Technical_Jargon", "Bad_Math", "Encyclopedic", "Commonsense", "Needs_Google", "Grammar_Usage", "Off-prompt", "Redundant", "Self-contradiction", "Incoherent"]
let black_text_errors_types = ["Commonsense", "Grammar_Usage", "Off-prompt"]
var error_types_dict = {
    "Technical_Jargon": "Technical Jargon",
    "Bad_Math": "Bad Math",
    "Encyclopedic": "Wrong: Encyclopedic",
    "Commonsense": "Wrong: Commonsense",
    "Needs_Google": "Needs Google",
    "Grammar_Usage": "Grammar / Usage",
    "Off-prompt": "Off-prompt",
    "Redundant": "Redundant",
    "Self-contradiction": "Self-contradiction",
    "Incoherent": "Incoherent"
};
var situation_text = {};
var old_value = ""

function substitute(input_text) {
    let new_input_text = input_text.replace(/,/g, "_SEP_");
    new_input_text = new_input_text.replace(/"/g, "_QUOTE_");
    new_input_text = new_input_text.replace(/</g, "_LEFT_");
    new_input_text = new_input_text.replace(/>/g, "_RIGHT_");
    new_input_text = new_input_text.replace(/[\r\n]+/g, "_NEWLINE_");
    return new_input_text
}

function reverse_substitute(input_text) {
    let new_input_text = input_text.replace(/_SEP_/g, ",");
    new_input_text = new_input_text.replace(/_QUOTE_/g, "\"");
    new_input_text = new_input_text.replace(/_LEFT_/g, "<");
    new_input_text = new_input_text.replace(/_RIGHT_/g, ">");
    new_input_text = new_input_text.replace(/_NEWLINE_/g, "\n");
    return new_input_text
}

/**
 * All selected spans
 */
class Characters {
    constructor(situationID, num) {
        this.situationID = situationID;
        this.num = num;
        this.data = [];
        this.displayID = situationID + '-display-' + num;
        this.serializeID = situationID + '-serialize';
    }
    add(newCS) {
        // check for duplicates and add if it's not there.
        for (let oldCS of this.data) {
            if (oldCS == null) {
                continue;
            }
            if (oldCS.equals(newCS)) {
                // animate it to show it exists.
                oldCS.noticeMeSenpai = true;
                return;
            }
        }
        this.data.push(newCS);
    }
    remove(cs) {
        for (let i = this.data.length - 1; i >= 0; i--) {
            if (this.data[i] == null) {
                continue;
            }
            if (this.data[i].equals(cs)) {
                this.data[i] = null
            }
        }
    }
    update() {
        this.render(this.num);
        // this.serialize(this.num);
    }

    update_1() {
        this.render_1();
        // this.serialize(this.num);
    }

    render_1() {
        let display = $('#' + this.displayID).empty();
        for (let i = 0; i < this.data.length; i++) {
            // console.log(this.data)
            if (this.data[i] == null) {
                continue;
            }
            display.append(this.data[i].render_1(this.situationID, i));
        }
    }


    render(num) {
        let display = $('#' + this.displayID).empty();
        let annotator_p = $('<span class="bb bw1 b--black-40 db mb1 mb2-ns"></span>')
        annotator_p.append($('<label>').prop({
            for: 'annotator',
            class: 'l-radio annotator-radio b'
        }).append(
            $('<input>').prop({
                type: 'radio',
                id: 'annotator-' + num,
                name: 'annotator',
                value: num
            }).css({ 'margin-right': '6px' })
        ).append(
            $('<span>').text('Annotator ' + num).addClass("f6 f5-ns ttu")
        )
        ).append(
            $('<br>')
        );


        display.append(annotator_p)
        if (this.data.length == 0) {
            display.append($("<span class='f6 f5-ns ttu i'>no problems found</span>"))
        } else {
            for (let i = 0; i < this.data.length; i++) {
                if (this.data[i] == null) {
                    continue;
                }
                display.append(this.data[i].render(this.situationID, num, i));
            }
        }
    }
    serialize() {
        let strings = [];
        for (let character of this.data) {
            if (character == null) {
                continue;
            }
            strings.push(character.serialize());
        }
        let vals = strings.join(',');
        if ($("#no_badness").is(':not(:checked)')) {
            var situationID = this.situationID
            let serialize = $('#' + situationID + '-serialize');
            serialize.attr('value', '[' + vals + ']');
        } else {
            old_value = '[' + vals + ']';
        }
    }
}
class CharacterSelection {
    constructor(error_type, explanation, severity, start_end_pairs, antecedent_start_end_pairs, num) {
        this.error_type = error_type;
        this.explanation = explanation;
        this.severity = severity
        this.start_end_pairs = start_end_pairs
        this.antecedent_start_end_pairs = antecedent_start_end_pairs
        this.num = num
        this.noticeMeSenpai = false;
    }
    equals(other) {
        return this.error_type == other.error_type && this.explanation == other.explanation
            && this.severity == other.severity && JSON.stringify(this.start_end_pairs) === JSON.stringify(other.start_end_pairs) && JSON.stringify(this.antecedent_start_end_pairs) === JSON.stringify(other.antecedent_start_end_pairs);
    }
    render(situationID, annotator_num, num) {
        let error_type = this.error_type, explanation = this.explanation, severity = this.severity, start_end_pairs = this.start_end_pairs, antecedent_start_end_pairs = this.antecedent_start_end_pairs; // so they go in the closure
        // let txt = $('#' + situationID).text().substring(start, end);
        let txt = error_types_dict[error_type] + " (" + severity + "): " + explanation;
        // let new_input_text = txt.replace(/"/g, "_QUOTE_");
        // new_input_text = new_input_text.replace(/</g, "_LEFT_");
        // new_input_text = new_input_text.replace(/>/g, "_RIGHT_");
        let color_class = error_type
        let text_color = "white"
        let opposite_color = "black"
        if (black_text_errors_types.includes(color_class)) {
            text_color = "black"
            opposite_color = "white"
        }

        // let removeButton = $('<button></button>')
        //     .addClass('bg-transparent ' + text_color +' bn hover-' + opposite_color + ' hover-bg-' + text_color + ' br-pill mr1 pointer')
        //     .append('✘')
        //     .on('click', function () {
        //         document.getElementById(situationID).innerHTML = situation_text[situationID]
        //         C.remove(new CharacterSelection(error_type, explanation, severity, start_end_pairs, antecedent_start_end_pairs));
        //         annotate(C, situation_text["situation-0"])
        //         C.update();
        //     });

        let span = $('<span></span>')
            .addClass('b bg-' + color_class + " " + text_color + ' pa2 ma1 br4 br-pill-ns dib quality-span')
            .append(txt);
        span.attr('id', 'quality-span-' + situationID + "-" + annotator_num + '-' + num)
        // span.addClass('quality-span-'+num)
        span.attr('data-situation-id', situationID)
        span.attr('data-error-type', error_type)
        span.attr('data-severity', severity)
        span.attr('data-explanation', explanation)
        span.attr('data-start-end-pairs', start_end_pairs)
        span.attr('data-antecedent-start-end-pairs', antecedent_start_end_pairs)
        // console.log(antecedent_start_end_pairs)
        span.attr('data-num', num)
        span.attr('data-annotator-num', annotator_num)
        // span.attr('data-num', characters_num)
        // if the character needs to be noticed, abide.
        if (this.noticeMeSenpai) {
            this.noticeMeSenpai = false;
            span.addClass("animated bounce faster");
            setTimeout(function () {
                span.removeClass('animated bounce faster');
            }, 1000);
        }
        return span;
    }

    render_1(situationID, num) {
        let error_type = this.error_type, explanation = this.explanation, severity = this.severity, start_end_pairs = this.start_end_pairs, antecedent_start_end_pairs = this.antecedent_start_end_pairs; // so they go in the closure
        // let txt = $('#' + situationID).text().substring(start, end);
        let txt = error_types_dict[error_type] + " (" + severity + "): " + explanation;
        // let new_input_text = txt.replace(/"/g, "_QUOTE_");
        // new_input_text = new_input_text.replace(/</g, "_LEFT_");
        // new_input_text = new_input_text.replace(/>/g, "_RIGHT_");
        let color_class = error_type
        let text_color = "white"
        let opposite_color = "black"
        if (black_text_errors_types.includes(color_class)) {
            text_color = "black"
            opposite_color = "white"
        }

        let removeButton = $('<button></button>')
            .addClass('bg-transparent ' + text_color + ' bn hover-' + opposite_color + ' hover-bg-' + text_color + ' br-pill mr1 pointer')
            .append('✘')
            .on('click', function () {
                document.getElementById(situationID).innerHTML = situation_text[situationID]
                C.remove(new CharacterSelection(error_type, explanation, severity, start_end_pairs, antecedent_start_end_pairs));
                annotate_1(C, situation_text["situation-1"])
                C.update_1();
            });

        let span = $('<span></span>')
            .addClass('b grow bg-' + color_class + " " + text_color + ' pa2 ma1 br-pill dib quality-span')
            .append(removeButton)
            .append(txt);
        span.attr('id', 'quality-span-' + num)
        // span.addClass('quality-span-'+num)
        span.attr('data-situation-id', situationID)
        span.attr('data-error-type', error_type)
        span.attr('data-severity', severity)
        span.attr('data-explanation', explanation)
        span.attr('data-start-end-pairs', start_end_pairs)
        span.attr('data-antecedent-start-end-pairs', antecedent_start_end_pairs)
        console.log(antecedent_start_end_pairs)
        span.attr('data-num', num)
        span.attr('data-annotator-num', 0)
        // span.attr('data-num', characters_num)
        // if the character needs to be noticed, abide.
        if (this.noticeMeSenpai) {
            this.noticeMeSenpai = false;
            span.addClass("animated bounce faster");
            setTimeout(function () {
                span.removeClass('animated bounce faster');
            }, 1000);
        }
        return span;
    }
    serialize() {
        // let txt = $('#' + situationID).text().substring(start, end);
        // let quality_name = quality_map[situationID][this.num]
        // let new_quality_name = quality_name.replace(/,/g, "_SEP_");
        // new_quality_name = new_quality_name.replace(/"/g, "_QUOTE_");
        // console.log($('#' + situationID).text())
        // // console.log($('#' + situationID).text().substring(0, 5))
        // console.log($('#' + situationID).text().length)
        // console.log($('#' + situationID).text())
        // console.log($('#' + situationID).text().substring(0, 5))
        // console.log($('#' + situationID).text().length)
        var filtered = this.antecedent_start_end_pairs.filter(function (el) {
            return el != null;
        });
        return '["' + substitute(this.error_type) + '","' + substitute(this.explanation) + '",' + this.severity + ',' + this.start_end_pairs[0][0] + ',' + this.start_end_pairs[0][1] + ',[' + filtered + ']]';
    }
}

// globals
let C = new Characters("situation-1", 0);
let C_list = []
// provided externally to the script!
// let start;
// let end;
let start_end_pairs = []
let antecedent_start_end_pairs = []
let start_end_pairs_1 = []
let antecedent_start_end_pairs_1 = []
let situationID = "situation-1";

function comparespan(span_a, span_b) {
    let index_a = span_a[1]
    let index_b = span_b[1]
    if (index_a == index_b) {
        return span_a[3] - span_b[3]
    }
    return index_a - index_b;
}

function annotate(character, annotator_num, text) {
    let character_selections = character.data
    $('.quality-span').removeClass("grow")
    $("#situation-0-display-" + annotator_num).children('.quality-span').addClass("grow")
    // console.log(character_selections)
    let span_list = []
    for (selection of character_selections) {
        if (selection == null) {
            continue;
        }
        let num = selection.num
        let p_span_id = "p-span-situation-0-" + annotator_num + "-" + num
        let start_end_pair = selection.start_end_pairs[0]
        span_list.push([p_span_id, start_end_pair[0], true, num, selection.error_type]);
        span_list.push([p_span_id, start_end_pair[1], false, num, selection.error_type]);
        let antecedent_start_end_pairs = selection.antecedent_start_end_pairs
        if (antecedent_start_end_pairs.length > 0) {
            for (antecedent of antecedent_start_end_pairs) {
                if (antecedent != null) {
                    span_list.push([p_span_id + "_antecedent", antecedent[0], true, num, selection.error_type + "_antecedent"]);
                    span_list.push([p_span_id + "_antecedent", antecedent[1], false, num, selection.error_type + "_antecedent"]);
                }
            }
        }
    }
    span_list.sort(comparespan)
    // console.log(span_list)
    // console.log(span_list)
    let new_text = ""
    for (i in span_list) {
        span = span_list[i]
        var before_pair_end;
        if (i == 0) {
            before_pair_end = 0
        } else {
            before_pair_end = span_list[i - 1][1]
        }
        start_temp = span[1]
        subtxt = text.substring(before_pair_end, start_temp)
        var span_to_add;
        var color_class = span[4]

        if (span[2]) {
            // span_to_add = "<span id=\"p-span-" + span[3]+ "\"class=\"annotation border-" + color_class + "\">"
            span_to_add = "<span class=\"annotation border-" + color_class + " " + span[0] + "\">"
        } else {
            span_to_add = "</span>"
            // multiple spans cross together (intersect)
            for (j = i; j > 0; j--) {
                if (span_list[j - 1][2] && span_list[j - 1][3] != span[3]) {
                    var previous_color_class = span_list[j - 1][4]
                    span_to_add += "</span>"
                } else {
                    break
                }
            }
            for (j = i; j > 0; j--) {
                if (span_list[j - 1][2] && span_list[j - 1][3] != span[3]) {
                    var previous_color_class = span_list[j - 1][4]
                    span_to_add += "<span class=\"annotation border-" + previous_color_class + " p-span-" + span_list[j - 1][3] + "\">"
                } else {
                    break
                }
            }
        }
        new_text += subtxt + span_to_add
    }
    if (span_list.length == 0) {
        new_text += text
    } else {
        new_text += text.substring(span_list[span_list.length - 1][1])
    }
    document.getElementById("situation-0").innerHTML = new_text
};

function annotate_1(character, text) {
    let character_selections = character.data
    let span_list = []
    for (selection of character_selections) {
        if (selection == null) {
            continue;
        }
        let num = selection.num
        let p_span_id = "p-span-situation-1-0-" + num
        let start_end_pair = selection.start_end_pairs[0]
        span_list.push([p_span_id, start_end_pair[0], true, num, selection.error_type]);
        span_list.push([p_span_id, start_end_pair[1], false, num, selection.error_type]);
        let antecedent_start_end_pairs = selection.antecedent_start_end_pairs
        if (antecedent_start_end_pairs.length > 0) {
            for (antecedent of antecedent_start_end_pairs) {
                if (antecedent != null) {
                    span_list.push([p_span_id + "_antecedent", antecedent[0], true, num, selection.error_type + "_antecedent"]);
                    span_list.push([p_span_id + "_antecedent", antecedent[1], false, num, selection.error_type + "_antecedent"]);
                }
            }
        }
    }
    // console
    console.log(span_list)
    span_list.sort(comparespan)
    // console.log(span_list)
    let new_text = ""
    for (i in span_list) {
        span = span_list[i]
        var before_pair_end;
        if (i == 0) {
            before_pair_end = 0
        } else {
            before_pair_end = span_list[i - 1][1]
        }
        start_temp = span[1]
        subtxt = text.substring(before_pair_end, start_temp)
        var span_to_add;
        var color_class = span[4]

        if (span[2]) {
            // span_to_add = "<span id=\"p-span-" + span[3]+ "\"class=\"annotation border-" + color_class + "\">"
            span_to_add = "<span class=\"annotation border-" + color_class + " " + span[0] + "\">"
        } else {
            span_to_add = "</span>"
            // multiple spans cross together (intersect)
            for (j = i; j > 0; j--) {
                if (span_list[j - 1][2] && span_list[j - 1][3] != span[3]) {
                    var previous_color_class = span_list[j - 1][4]
                    span_to_add += "</span>"
                } else {
                    break
                }
            }
            for (j = i; j > 0; j--) {
                if (span_list[j - 1][2] && span_list[j - 1][3] != span[3]) {
                    var previous_color_class = span_list[j - 1][4]
                    span_to_add += "<span class=\"annotation border-" + previous_color_class + " p-span-" + span_list[j - 1][3] + "\">"
                } else {
                    break
                }
            }
        }
        new_text += subtxt + span_to_add
    }
    if (span_list.length == 0) {
        new_text += text
    } else {
        new_text += text.substring(span_list[span_list.length - 1][1])
    }
    document.getElementById("situation-1").innerHTML = new_text
};

function annotate_select_span(character, text, select_span, select_antecedents) {
    let character_selections = character.data
    let span_list = []
    for (selection of character_selections) {
        if (selection == null) {
            continue;
        }
        let num = selection.num
        let p_span_id = "p-span-" + num
        let start_end_pair = selection.start_end_pairs[0]
        span_list.push([p_span_id, start_end_pair[0], true, num, selection.error_type]);
        span_list.push([p_span_id, start_end_pair[1], false, num, selection.error_type]);
    }
    for (l in select_antecedents) {
        if (select_antecedents[l] != null) {
            span_list.push(["select-antecedent--" + (l + 1), select_antecedents[l][0], true, -1, "select-antecedent"]);
            span_list.push(["select-antecedent--" + (l + 1), select_antecedents[l][1], false, -1, "select-antecedent"]);
        }
    }
    if (select_span !== undefined) {
        span_list.push(["select-span--1", select_span[0], true, -1, "select-span"]);
        span_list.push(["select-span--1", select_span[1], false, -1, "select-span"]);
    }
    // console.log(span_list)
    span_list.sort(comparespan)
    // console.log(span_list)
    let new_text = ""
    for (i in span_list) {
        span = span_list[i]
        var before_pair_end;
        if (i == 0) {
            before_pair_end = 0
        } else {
            before_pair_end = span_list[i - 1][1]
        }
        start_temp = span[1]
        subtxt = text.substring(before_pair_end, start_temp)
        var span_to_add;
        var color_class = span[4]
        if (span[2]) {
            // span_to_add = "<span id=\"p-span-" + span[3]+ "\"class=\"annotation border-" + color_class + "\">"
            span_to_add = "<span class=\"annotation border-" + color_class + " " + span[0] + "\">"
            if (span[4] == "select-span") {
                span_to_add = "<span class=\"annotation bg-yellow " + span[0] + "\">"
            }
            if (span[4] == "select-antecedent") {
                span_to_add = "<span class=\"annotation bg-light-yellow " + span[0] + "\">"
            }
        } else {
            span_to_add = "</span>"
            // multiple spans cross together (intersect)
            for (j = i; j > 0; j--) {
                if (span_list[j - 1][2] && span_list[j - 1][3] != span[3]) {
                    var previous_color_class = span_list[j - 1][4]
                    span_to_add += "</span>"
                } else {
                    break
                }
            }
            for (j = i; j > 0; j--) {
                if (span_list[j - 1][2] && span_list[j - 1][3] != span[3]) {
                    var previous_color_class = span_list[j - 1][4]
                    if (span_list[j - 1][4] == "select-span") {
                        span_to_add += "<span class=\"annotation bg-yellow " + span_list[j - 1][0] + "\">"
                    }
                    if (span_list[j - 1][4] == "select-antecedent") {
                        span_to_add += "<span class=\"annotation bg-light-yellow " + span_list[j - 1][0] + "\">"
                    }
                    else {
                        span_to_add += "<span class=\"annotation border-" + previous_color_class + " " + span_list[j - 1][0] + "\">"
                    }
                } else {
                    break
                }
            }
        }
        new_text += subtxt + span_to_add
    }
    if (span_list.length == 0) {
        new_text += text
    } else {
        new_text += text.substring(span_list[span_list.length - 1][1])
    }
    document.getElementById("situation-1").innerHTML = new_text
};

function list_antecedents() {
    let display = $('#selection_antecedent').text("Selected antecedents: ");
    // console.log(antecedent_start_end_pairs)
    for (a in antecedent_start_end_pairs_1) {
        pair = antecedent_start_end_pairs_1[a]
        if (pair != null) {
            start = pair[0]
            end = pair[1]
            let txt = situation_text["situation-1"].substring(start, end)
            let removeButton = $('<button></button>')
                .addClass('bg-transparent black bn hover-white hover-bg-black br-pill mr1')
                .attr('antecedent-num', a)
                .append('✘')
                .on('click', function () {
                    antecedent_start_end_pairs_1[$(this).attr('antecedent-num')] = null
                    list_antecedents();
                    // C.remove(new CharacterSelection(error_type, explanation, severity, start_end_pairs));
                    annotate_select_span(C, situation_text["situation-1"], start_end_pairs_1[0], antecedent_start_end_pairs_1)
                    // C.update();
                });
            let span = $('<span></span>')
                .addClass('bg-light-yellow black pa2 ma1 dib quality-span')
                .append(removeButton)
                .append(txt);
            display.append(span);
        }
    }
}

function disable_everything() {
    // $('#confirm_button').prop('disabled', true);
    $("input[name='error_type']").removeClass("selected")
    $("input:radio[name='severity']").prop('checked', false);
    $("input:radio[name='error_type']").prop('checked', false);
    $('#explanation').val('');
    $("#button_div").addClass("disable");
    $("#severity_div").addClass("disable");
    $("#explanation_div").addClass("disable");
    $("#antecedent_selection").slideUp("fast");
    // antecedent_start_end_pairs = []
    // annotate_select_span(C, situation_text["situation-0"], start_end_pairs[0], antecedent_start_end_pairs)
}

// script
$(document).ready(function () {
    Papa.parse(filename, {
        worker: true,
        download: true,
        complete: function (results) {
            // console.log(results["data"][0])
            // ["id", "gid", "prompt", "generation", "model", "p", "temperature", "frequency_penalty", "responses"]

            situation_text['situation-1'] = $('#' + 'situation-1').text()

            var pageX;
            var pageY;

            function getRandomIntInclusive(min, max) {
                min = Math.ceil(min);
                max = Math.floor(max);
                return Math.floor(Math.random() * (max - min + 1) + min); //The maximum is inclusive and the minimum is inclusive
            }

            function compareResponse(r1, r2) {
                let start1 = r1[3]
                let start2 = r2[3]
                return start1 - start2;
            }

            function selectDataByModel(data, model) {
                var new_data = []
                for (row of data) {
                    if (row[4] == model) {
                        new_data.push(row)
                    }
                }
                return new_data
            }

            function view_example(situation_num) {
                C_list = []
                var prompt = results["data"][situation_num][2]
                var generation = results["data"][situation_num][3]
                // console.log(results["data"][situation_num][8])
                // console.log(eval(results["data"][situation_num][8])[3])
                var responses = eval(results["data"][situation_num][8])
                var model = results["data"][situation_num][4]
                var p = results["data"][situation_num][5]
                var temperature = results["data"][situation_num][6]
                var frequency_penalty = results["data"][situation_num][7]

                if (model == "gpt2") {
                    model = "GPT-2 Small"
                } else if (model == "gpt2-xl") {
                    model = "GPT-2 XL"
                } else if (model == "grover-mega") {
                    model = "Grover-Mega"
                } else if (model == "human") {
                    model = "Human"
                } else if (model == "gpt3") {
                    model = "GPT-3"
                }
                if (model == "Human") {
                    $('#situation-0-model').text("Continuation written by Human:")
                } else {
                    if (temperature == "0.0") {
                        $('#situation-0-model').text("Continuation written by " + model + " (argmax, frequency penalty = " + frequency_penalty + "):")
                    } else {
                        $('#situation-0-model').text("Continuation written by " + model + " (p = " + p + ", temperature = " + temperature + ", frequency penalty = " + frequency_penalty + "):")
                    }
                }

                $('#situation-0-example-id').text("Example id: " + (situation_num - 1))

                // console.log(results["data"][1][0])
                // console.log(results["data"][1307])

                // $("#id-input").attr({
                //     "max":parseInt(results["data"][results["data"].length - 1][0])
                // });

                // build up elements we're working with
                $('#situation-0-prompt').text(prompt)
                $('#situation-0').text(generation)
                situation_text['situation-0'] = generation

                // height. we want at least as big as the situation display, ideally bigger.
                let bigDisplayHeight = 800;
                let situationHeight = $('#situation-0-div').height();
                let desiredHeight = Math.max(bigDisplayHeight, situationHeight);
                $('#situation-0-displays').height(desiredHeight);
                // backup in case not enough space.
                if (desiredHeight > $(window).height()) {
                    $('#situation-0-displays').height($(window).height())
                }


                for (var i in responses) {
                    var C_temp = new Characters("situation-0", i)
                    if (responses[i].length == 0) {
                        C_list.push(C_temp);
                        C_temp.update()
                        continue;
                    }
                    responses[i].sort(compareResponse)
                    for (var error of responses[i]) {
                        var error_type = error[0]
                        var explanation = reverse_substitute(error[1])
                        var severity = error[2]
                        var start_end_pairs = [[error[3], error[4]]]
                        var antecedent_start_end_pairs = [error[5]]
                        if (error[5].length == 0) {
                            antecedent_start_end_pairs = []
                        }

                        C_temp.add(new CharacterSelection(error_type, explanation, severity, start_end_pairs, antecedent_start_end_pairs, C_temp.data.length));
                    }
                    C_list.push(C_temp);
                    C_temp.update()
                }

                var annotator_num = 0
                // console.log(C_list[annotator_num])
                $("#annotator-" + annotator_num).prop("checked", true);
                // C_list[3].update()
                annotate(C_list[annotator_num], annotator_num, situation_text["situation-0"])

                // console.log(C_list.length)
            }

            function load_dropdown_menu(model) {
                $("#prompt-dropdown > .dropdown-menu").empty()
                var data = results["data"].slice(1, results["data"].length - 1)
                if (model != "") {
                    data = selectDataByModel(data, model)
                }
                for (var row of data) {
                    $("#prompt-dropdown > .dropdown-menu").append(
                        $('<li>').attr('data-situation-num', row[0]).text(row[0] + ": " + row[2]))
                }
            }

            load_dropdown_menu("")

            var situation_num = getRandomIntInclusive(0, 1307) + 1

            view_example(situation_num)

            // $(document).on('click', '#view-button', function(e){
            //     var situation_num = parseInt($("#prompt-dropdown > input").attr('data-situation-num'))
            //     console.log(situation_num +1)
            //     if (isNaN(situation_num) || situation_num < 0 || situation_num > 1307) {
            //         alert("Example id must be in [0, 1307]")
            //     } else {
            //         view_example(situation_num + 1)
            //     }
            // });

            $(document).on('click', '.annotator-radio', function () {
                var radio = $(this).children('input')
                radio.prop("checked", true);
                var annotator_num = radio.val()
                annotate(C_list[annotator_num], annotator_num, situation_text["situation-0"])
            });

            $(document).on('mouseover', '.quality-span', function (e) {
                // $(this).css("color","black")
                // $(this).css("background-color","white")
                var color_class = $(this).attr("data-error-type")
                // $(this).removeClass(color_class)
                var quality_id = e.target.id
                var situation_id = $(this).attr("data-situation-id")
                var span_num = $(this).attr("data-num")
                var span_annotator_num = $(this).attr("data-annotator-num")
                var p_span_id = ".p-span-" + situation_id + "-" + span_annotator_num + "-" + span_num
                $(p_span_id).addClass("bg-" + color_class);
                var antecedent_color_class = color_class + "_antecedent"
                var antecedent_p_span_id = ".p-span-" + situation_id + "-" + span_annotator_num + "-" + span_num + "_antecedent"
                $(antecedent_p_span_id).addClass("bg-" + antecedent_color_class);
                if (black_text_errors_types.includes(color_class)) {
                    $(p_span_id).addClass("black");
                    $(antecedent_p_span_id).addClass("black")
                } else {
                    $(p_span_id).addClass("white");
                    $(antecedent_p_span_id).addClass("white")
                }

                // cs = C.data[span_num]
                // var start_end_pair = cs.start_end_pairs[0]
                // let text = document.getElementById(situation_id).innerHTML
                // start_temp = start_end_pair[0]
                // end_temp = start_end_pair[1]
                // subtxt = text.substring(start_temp, end_temp)
                // front_part = text.substring(0, start_temp)
                // end_part = text.substring(end_temp)
                // old_text = text
                // text = front_part + "<span class=\""+color_class+"\">" + subtxt + "</span>" + end_part
                // document.getElementById(situation_id).innerHTML = text
            });
            $(document).on('mouseout', '.quality-span', function (e) {
                // $(this).css("color","white")
                var color_class = $(this).attr("data-error-type")
                // $(this).addClass(color_class)
                var quality_id = e.target.id
                var situation_id = $(this).attr("data-situation-id")
                var span_num = $(this).attr("data-num")
                var span_annotator_num = $(this).attr("data-annotator-num")
                var p_span_id = ".p-span-" + situation_id + "-" + span_annotator_num + "-" + span_num
                $(p_span_id).removeClass("bg-" + color_class);
                var antecedent_color_class = color_class + "_antecedent"
                var antecedent_p_span_id = ".p-span-" + situation_id + "-" + span_annotator_num + "-" + span_num + "_antecedent"
                $(antecedent_p_span_id).removeClass("bg-" + antecedent_color_class);
                if (black_text_errors_types.includes(color_class)) {
                    $(p_span_id).removeClass("black");
                    $(antecedent_p_span_id).removeClass("black")
                } else {
                    $(p_span_id).removeClass("white");
                    $(antecedent_p_span_id).removeClass("white")
                }

                // document.getElementById(situation_id).innerHTML = situation_text[situation_id]
            });

            // $("#quality-selection").on('keydown',function(e) {
            //     var disabled = $('#confirm_button').prop("disabled")
            //     if(e.key === "Enter" && !disabled) {
            //         e.preventDefault();
            //         $('#confirm_button').click();
            //     }
            // });
            $(document).on("keypress", function (e) {
                if (e.key === "Enter") {
                    e.preventDefault();
                }
            });


            // selection js


            $('#close-icon').on("click", function (e) {
                $("input:radio[name='severity']").prop('checked', false);
                $('#error_type').val('');
                $('#explanation').val('');
                $("#quality-selection").fadeOut(0.2);
                start_end_pairs_1 = []
                antecedent_start_end_pairs_1 = []
                annotate_1(C, situation_text["situation-1"])
                disable_everything();
            });
            $("#situation-1").on("mousedown", function (e) {
                pageX = e.pageX;
                pageY = e.pageY;
                document.getElementById("situation-1").innerHTML = situation_text["situation-1"]
            });
            $("#situation-1").on('mouseup', function (e) {
                situationID = e.target.id;
                // console.log(situationID)
                let selection = window.getSelection();
                if (selection.anchorNode != selection.focusNode || selection.anchorNode == null) {
                    // highlight across spans
                    return;
                }
                // $('#quality-selection').fadeOut(1);
                let range = selection.getRangeAt(0);
                let [start, end] = [range.startOffset, range.endOffset];
                if (start == end) {
                    // disable on single clicks
                    annotate_1(C, situation_text["situation-1"])
                    return;
                }
                // manipulate start and end to try to respect word boundaries and remove
                // whitespace.
                end -= 1; // move to inclusive model for these computations.
                let txt = $('#' + situationID).text();
                while (txt.charAt(start) == ' ') {
                    start += 1; // remove whitespace
                }
                while (start - 1 >= 0 && txt.charAt(start - 1) != ' ') {
                    start -= 1; // find word boundary
                }
                while (txt.charAt(end) == ' ') {
                    end -= 1; // remove whitespace
                }
                while (end + 1 <= txt.length - 1 && txt.charAt(end + 1) != ' ') {
                    end += 1; // find word boundary
                }
                // move end back to exclusive model
                end += 1;
                // stop if empty or invalid range after movement
                if (start >= end) {
                    return;
                }
                // console.log([start, end])
                if ($("#antecedent_selection").first().is(":hidden")) {
                    start_end_pairs_1 = []
                    antecedent_start_end_pairs_1 = []
                    start_end_pairs_1.push([start, end])
                    let selection_text = "<b>Selected span:</b> <a class=\"selection_a\">";
                    start = start_end_pairs_1[0][0]
                    end = start_end_pairs_1[0][1]
                    let select_text = $('#' + situationID).text().substring(start, end)
                    selection_text += select_text + "</a>"
                    // if (start_end_pairs.length != 1) {
                    //     for (pair of start_end_pairs.slice(1)) {
                    //         start = pair[0]
                    //         end = pair[1]
                    //         let select_text = $('#' + situationID).text().substring(start, end)
                    //         selection_text += ", <a class=\"selection_a\">" + select_text + "</a>"
                    //     }
                    // }
                    document.getElementById("selection_text").innerHTML = selection_text
                    $('#quality-selection').css({
                        'display': "inline-block",
                        'left': pageX - 45,
                        'top': pageY + 20
                    }).fadeIn(200, function () {
                        disable_everything()
                    });
                    annotate_select_span(C, situation_text["situation-1"], [start, end], antecedent_start_end_pairs_1)
                } else {
                    $("#explanation_div").removeClass("disable");
                    antecedent_start_end_pairs_1.push([start, end])
                    list_antecedents()
                    // let selection_text = "Selected antecedents: <a class=\"selection_a_antecedent\">";
                    // start = antecedent_start_end_pairs[0][0]
                    // end = antecedent_start_end_pairs[0][1]
                    // let select_text = $('#' + situationID).text().substring(start, end)
                    // selection_text += select_text + "</a>"
                    // if (antecedent_start_end_pairs.length != 1) {
                    //     for (pair of antecedent_start_end_pairs.slice(1)) {
                    //         start = pair[0]
                    //         end = pair[1]
                    //         let select_text = $('#' + situationID).text().substring(start, end)
                    //         selection_text += ", <a class=\"selection_a_antecedent\">" + select_text + "</a>"
                    //         annotate_select_span(C, situation_text["situation-1"], [start, end])
                    //     }
                    // }
                    // document.getElementById("selection_antecedent").innerHTML = selection_text
                    annotate_select_span(C, situation_text["situation-1"], start_end_pairs_1[0], antecedent_start_end_pairs_1)
                }
            });
            $('#confirm_button').on("click", function (e) {
                // var disabled = $(this).prop("disabled")

                // get text input value
                var error_type = $('input[name="error_type"]:checked').val();
                var explanation = $("textarea#explanation").val();
                var severity = $('input[name="severity"]:checked').val();
                if (error_type === "" || explanation === "" || severity === undefined) {
                    alert("Error Type, Explanation, and Severity are required!")
                    return false
                }
                let display = $('#' + situationID + "-display")
                display.attr('id', situationID + '-display')
                display.attr('data-situation-id', situationID)
                C.add(new CharacterSelection(error_type, explanation, severity, start_end_pairs_1, antecedent_start_end_pairs_1, C.data.length));

                C.update_1();
                $('#quality-selection').fadeOut(1, function () {
                    disable_everything()
                });
                start_end_pairs_1 = []
                antecedent_start_end_pairs_1 = []
                annotate_1(C, situation_text["situation-1"])
                // console.log(C)
            });
            // $(document).on('focusout','.quality',function(e){
            //     var situation_id = $(this).attr("data-situation-id")
            //     var quality_num = $(this).attr("data-quality-num")
            //     var new_quality = $(this).text()
            //     let new_input_text = new_quality.replace(/"/g, "_QUOTE_");
            //     new_input_text = new_input_text.replace(/</g, "_LEFT_");
            //     new_input_text = new_input_text.replace(/>/g, "_RIGHT_");
            //     quality_map[situation_id][quality_num] = new_input_text
            //     AC.update()
            // });

            $("#no_badness").on("change", function () {
                if ($(this).is(':checked')) {
                    old_value = $("#situation-1-serialize").attr("value")
                    $("#situation-1-serialize").attr("value", "There is no badeness in text.")
                } else {
                    $("#situation-1-serialize").attr("value", old_value)
                }
            });

            // clear button in the quality select box
            $("#clear_button").on("click", function () {
                $("input:radio[name='error_type']").prop('checked', false);
                $("input:radio[name='severity']").prop('checked', false);
                $('#error_type').val('');
                $('#explanation').val('');
            });

            $(".antecedent_able").on('click', function (e) {
                if (!$(this).hasClass("selected")) {
                    $("input[name='error_type']").removeClass("selected")
                    $(this).addClass("selected")
                    $("#antecedent_selection").slideDown("fast");
                    antecedent_start_end_pairs_1 = []
                    annotate_select_span(C, situation_text["situation-1"], start_end_pairs_1[0], antecedent_start_end_pairs_1)
                    var id = $(this).attr("id")
                    if (id == "error-8") {
                        document.getElementById("antecedent_select_text").innerHTML = "Select the antecedents (earlier spans of text) that are being repeated."
                    } else if (id == "error-9") {
                        document.getElementById("antecedent_select_text").innerHTML = "Select the antecedents (earlier spans of text) that are being contradicted."
                    }
                    document.getElementById("selection_antecedent").innerHTML = "Selected antecedents: "
                    $("input:radio[name='severity']").prop('checked', false);
                    $('#explanation').val('');
                    $("#button_div").addClass("disable");
                    $("#severity_div").addClass("disable");
                    $("#explanation_div").addClass("disable");
                }
            });

            $(".antecedent_no_able").on('click', function (e) {
                $("input[name='error_type']").removeClass("selected")
                $("#antecedent_selection").slideUp("fast");
                antecedent_start_end_pairs_1 = []
                annotate_select_span(C, situation_text["situation-1"], start_end_pairs_1[0], antecedent_start_end_pairs_1)
                document.getElementById("selection_antecedent").innerHTML = "Selected antecedents: "
                $("input:radio[name='severity']").prop('checked', false);
                $('#explanation').val('');
                $("#button_div").addClass("disable");
                $("#severity_div").addClass("disable");
                $("#explanation_div").removeClass("disable");
            });

            $("#explanation").on('change keyup paste', function () {
                $("#severity_div").removeClass("disable");
            });

            $(document).on('click', '.checkbox-tools-severity', function (e) {
                $("#button_div").removeClass("disable");
            });

            $(function () {
                $("#quality-selection").draggable();
            });
            // dropdown js
            $(document).on('click', '.dropdown', function (e) {
                $(this).attr('tabindex', 1).focus();
                $(this).toggleClass('active');
                $(this).find('.dropdown-menu').slideToggle(300);
            });
            $(document).on('focusout', '.dropdown', function (e) {
                $(this).removeClass('active');
                $(this).find('.dropdown-menu').slideUp(300);
            });

            $(document).on("click", '#model-dropdown .dropdown-menu li', function (e) {
                $(this).parents('.dropdown').find('span').text($(this).text());
                $(this).parents('.dropdown').find('input').attr('value', $(this).attr('data-model-type'));
                load_dropdown_menu($(this).attr('data-model-type'))
            });

            $(document).on("click", '#prompt-dropdown .dropdown-menu li', function (e) {
                $(this).parents('.dropdown').find('span').text($(this).text().substring(0, 85) + "...");
                $(this).parents('.dropdown').find('input').attr('data-situation-num', $(this).attr('data-situation-num'));
                var situation_num = parseInt($(this).attr('data-situation-num'))
                console.log(situation_num + 1)
                view_example(situation_num + 1)
            });


            /*End Dropdown Menu*/

            // $('.dropdown-menu li').click(function () {
            // var input = '<strong>' + $(this).parents('.dropdown').find('input').val() + '</strong>',
            // msg = '<span class="msg">Hidden input value: ';
            // $('.msg').html(msg + input + '</span>');
            // });

        }
    });
});
