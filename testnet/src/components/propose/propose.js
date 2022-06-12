import React from "react";
import './propose.scss';

const Propose = () => {

    //disable past dates
    const disablePastDate = () => {
        const today = new Date();
        const dd = String(today.getDate() + 1).padStart(2, "0");
        const mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
        const yyyy = today.getFullYear();
        return yyyy + "-" + mm + "-" + dd;
    };
    return (
       <div className="propose">
           <div className="create_elt">
      <div className="create_elt_inn">
        <div className="crt_hd">
          <p className="converter-header"> Create Proposal & Schedule Election</p>
        </div>


        <div className="vote_sect">
          <div className="vote_sect_img">

          </div>

          <div className="v_inp_cov inpCont_cand">
            <p className="inp_tit">Governance name</p>
            <input
              type="text"
            />
            <p className="ensure_txt">
              A short header for your proposal
            </p>
          </div>

          <div className="v_inp_cov inpCont_cand">
            <p className="inp_tit">Voting issue</p>
            <input
              type="text"
            />
            <p className="ensure_txt">
              A short description of what the issue is about
            </p>
          </div>
          <div className="v_inp_cov inpCont_cand">
            <p className="inp_tit">Option 1</p>
            <input
              type="text"
            />
            <p className="ensure_txt">
              What option 1 should be
            </p>
          </div>
      
          <div className="v_inp_cov inpCont_cand">
            <p className="inp_tit">Option 2</p>
            <input
              type="text"
            />
            <p className="ensure_txt">
              What option 2 should be
            </p>
          </div>

          <div className="v_inp_cov inpCont_cand">
            <p className="inp_tit">Governance Date</p>
            <input
              type="date"
              min={disablePastDate()}
            />
            <p className="ensure_txt">
              Pick a date for election
            </p>
          </div>
          
          

          <br />

          <div className="crt_butt">
            <button>Create Proposal</button>
            <p className="safety">
              <span>Safety disclaimer :</span> We never store your data.
              Everything is encrypted.
            </p>
          </div>

          {/* ************** */}
        </div>

        {/* **************** */}
      </div>
    </div>
       </div>
    );
}

export default Propose;