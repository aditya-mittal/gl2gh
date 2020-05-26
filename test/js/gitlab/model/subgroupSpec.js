var assert = require('assert');
var should = require('chai').should();
var Subgroup = require('../../../../src/gitlab/model/subgroup.js');

describe('Subgroup', function() {
    it('must have name', function() {
      //given
      var name = "subgroup-1";
      //when
      var subgroup = new Subgroup(name)
      //then
      subgroup.should.be.a('object');
      subgroup.should.be.instanceof(Subgroup);
      subgroup.should.have.property('name')
      subgroup.should.have.all.keys('name')
    });
});