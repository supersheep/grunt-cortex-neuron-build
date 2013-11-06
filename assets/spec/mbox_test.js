describe("mbox", function(){
    describe("single mbox", function(){
        it("should return instance of Mbox", function(done){
            _use(["mbox@0.0.1"],function(mbox) {
                expect(mbox({})).to.be.a("object");
                done();
            }); 
        });

        it("should open and close properly", function(done){
            _use(["mbox@0.0.1","jquery@1.9.2"],function(mbox,$) {
                var mybox = mbox({
                    content:"<div>see me</div>"
                });

                expect(mybox).to.be.a("object");
                mybox.open();
                expect($("#mbox_overlay").length).to.equal(1);
                mybox.close();
                expect($("#mbox_overlay").length).to.equal(0);
                done();
            }); 
        });
    });

    describe("multi mboxes",function(){

        it("should be able to open multi mboxes", function(done){
            _use(["mbox@0.0.1","jquery@1.9.2"],function(mbox,$) {
                var mybox1 = mbox({
                    content:"<div>see me</div>"
                });
                var mybox2 = mbox({
                    content:"<div>see me</div>"
                });
                var mybox3 = mbox({
                    content:"<div>see me</div>"
                });

                mybox1.open();mybox2.open();mybox3.open();
                expect($("#mbox_overlay").length).to.equal(1);
                mybox1.close();mybox2.close();
                expect($("#mbox_overlay").length).to.equal(1);
                mybox3.close();
                console.log($("#mbox_overlay").length);
                expect($("#mbox_overlay").length).to.equal(0);
                done();
            }); 
        });

    })
});