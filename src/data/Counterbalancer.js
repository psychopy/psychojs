/**
 * Counterbalancer handles group allocation for a given experiment. Once 
 * allocated to a group using data from the shelf, the Counterbalancer provides 
 * access to group-specific parameters as specified by a conditions array.
 *
 * @author Todd Parsons
 * @version 2024.1.0
 * @copyright (c) 2023 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 */

import {PsychObject} from "../util/PsychObject.js";


/**
 * <p>Counterbalancer handles group allocation for a given experiment. Once 
 * allocated to a group using data from the shelf, the Counterbalancer provides 
 * access to group-specific parameters as specified by a conditions array.</p>
 *
 * @extends PsychObject
 */
export class Counterbalancer extends PsychObject
{
    /**
	 * @memberOf module:data
	 * @param {Object} options
	 * @param {module:core.PsychoJS} options.psychoJS    the PsychoJS instance
     * @param {string} options.entry    name of the entry from which to get group allocation from
     * @param {array} options.conditions    array of dictionaries with extra information for each group
	 * @param {boolean} [options.autoLog = false]    whether to log
	 */
    constructor({psychoJS, entry, conditions, autoLog = false } = {})
	{
		super(psychoJS);
        // store entry name
        this._addAttribute('entry', entry);
        // store conditions array
        this._addAttribute('conditions', conditions);
        // placeholder values before querying Pavlovia
        this._addAttribute('group', undefined);
        this._addAttribute('params', undefined);
        // store autoLog
        this._addAttribute('autoLog', autoLog);
	}

    /**
	 * Assign a group to this Counterbalancer object, from the shelf.
     * 
     * @returns {string} group assignment
	 */
    async allocateGroup({} = {}) {
        // get group names and sizes from conditions array
        let groups = [];
        let groupSizes = [];
        for (let row of this.conditions) {
            groups.push(row['group']);
            groupSizes.push(row['cap']);
        }
        // get group assignment from shelf
        let resp = await psychoJS.shelf.counterBalanceSelect({
            key: [this.entry],
            groups: groups, 
            groupSizes: groupSizes,
        });
        // store group
        this.group = resp.group;
        // get params from matching row of conditions array
        for (let row of this.conditions) {
            if (row['group'] == this.group) {
                this.params = row;
            }
        }
        // return group
        return this.group
    }
}