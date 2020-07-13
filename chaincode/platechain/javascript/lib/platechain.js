'use strict';
const { Contract } = require('fabric-contract-api');
class PlateChain extends Contract {
	
	constructor() {
        super();
        this.nextPlateId = 0;
    }
	
    async initLedger(ctx) {
        var sKey = 'LP_0' + this.nextPlateId;
        var d = new Date();
        var time = d.toLocaleString();
        var jValue = {ownerName: 'Chris', carModel: 'Mustang', date: time, issueStatus: 'unissued'};
        await ctx.stub.putState(sKey, Buffer.from(JSON.stringify(jValue)));
		this.nextPlateId++;
    }

    async checkPlate(ctx, _ownerName, _carModel, _company, _payment) {
		var _key = "LP_0" + this.nextPlateId;
		var date = new Date();
        if(_payment != 100){
            var jValue = { ownerName: _ownerName , company: _company, car_model : _carModel, date: date.toLocaleString(), issueStatus: 'rejected'};
            await ctx.stub.putState(_key, Buffer.from(JSON.stringify(jValue)));
        }else{
			const exists = await this.createPlate(ctx, _key, _ownerName, _carModel, _company);
		}
		this.nextPlateId++;
    }

    async createPlate(ctx, _key, _ownerName, _carModel, _company) {
		var date = new Date();
        var jValue = {ownerName: _ownerName , company: _company, car_model : _carModel, date: date.toLocaleString() , issueStatus: 'issued'};
        var bValue = await ctx.stub.putState(_key, Buffer.from(JSON.stringify(jValue)));
    }
    
    async renewPlate(ctx, _key) {
        const plateAsBytes = await ctx.stub.getState( _key );
        if (!plateAsBytes || plateAsBytes.length === 0) {
            throw new Error(`${_key} does not exist`);
        }
		var date = new Date();
        const renewPlate = JSON.parse(plateAsBytes.toString());
        renewPlate.date = date.toLocaleString();
		renewPlate.issueStatus = "renewed";
        await ctx.stub.putState(_key, Buffer.from(JSON.stringify(renewPlate)));
    }
	
    async getPlate(ctx, _key) {
        const plateAsBytes = await ctx.stub.getState(_key);
        if (!plateAsBytes || plateAsBytes.length === 0) {
            throw new Error(`${_key} does not exist`);
        }
        console.log(plateAsBytes.toString());
        return plateAsBytes.toString();
    }
}

module.exports = PlateChain;
