

import axios from "axios";
import algosdk from "algosdk";
import { useEffect, useState } from "react";
import "./styles/electionlist.css";
import WalletConnect from "@walletconnect/client"; 
import MyAlgoConnect from "@randlabs/myalgo-connect";
import { useDispatch } from "react-redux";
import { formatJsonRpcRequest } from "@json-rpc-tools/utils";
import QRCodeModal from "algorand-walletconnect-qrcode-modal";
import { ASSET_ID} from "./constants";
import BottomNavigationBar from "./statics/BottomNavigationBar";
import moment from "moment";
import DatePicker from "react-datepicker";
import './styles/date-picker.css'
// import {subDays} from 'react-datepicker';


const Payment = () => {
  const dispatch = useDispatch();


  const [ASAdata, setASAdata] = useState("");
  const [date, setDate] = useState("");

  const isThereAddress = localStorage.getItem("address");

  const [dateRange, setDateRange] = useState({
    startDate: new Date(moment().startOf("isoweek").utc()),
    endDate: new Date(moment().endOf("week").utc())
  });

  // let realDate;

  useEffect(() => {
    axios.get('https://tita-backend.herokuapp.com/data').then(response => {
      // eslint-disable-next-line
       response.data.data.map(asa => {
            
         if(asa.date === date) {
            setASAdata(asa.date)
            console.log("true")
       }
  
      })

    })
  }, [date])
  



  const handleDateChange = (date) => {
        const offset = date.getTimezoneOffset()
   let yourDate = new Date(date.getTime() - (offset*60*1000))
    setDateRange({ ...dateRange, startDate: yourDate }) 
   setDate(yourDate.toISOString().split('T')[0])
    
   console.log(yourDate.toISOString().split('T')[0])

   
  
  }


  const algod_token = {
    "X-API-Key": "z6H94GE3sI8w100S7MyY92YMK5WIPAmD6YksRDsC"
  }
  const algod_address = "https://mainnet-algorand.api.purestake.io/ps2";
  const headers = "";

  const algodClient = new algosdk.Algodv2(algod_token, algod_address, headers);
  const walletType = localStorage.getItem("wallet-type");
  const rewardsAddress = 'ZW4E323O6W3JTTVCDDHIF6EY75HSU56H7AGD3UZI54XCQOMNRCWRTYP5PQ'
  const serviceAddress = 'WIOAXYVLJ6YQXS6RI2ROHXHQAKGYND56BY2A5O7ZV3C7GLRR2FCLIIR7VM'
 
 

  const election_data = [
    {

      card_desc:
        "Tita is Choice Coin Payment Gateway For ASA Governance And Checking Governance Scheduling Dates",
      process_image: "https://i.postimg.cc/yNxZcP9m/km-20220401-480p-1-1.gif",
      title: "TITA: ASA Governance Gateway",
    },
  ];

 

  

  const myAlgoSign = async () => {

    const RewardsInchoice = document.getElementById('rewards').value
    const ServiceInAlgo = document.getElementById('service').value
    const governanceName = document.getElementById('governance').value
    const governanceIssue = document.getElementById('issue').value
    const governanceOption1 = document.getElementById('option-1').value
    const governanceOption2 = document.getElementById('option-2').value
  

    const myAlgoWallet = new MyAlgoConnect({ shouldSelectOneAccount: false });

    try {
      const address = !!isThereAddress && isThereAddress 

      const myAccountInfo = await algodClient
        .accountInformation(
          !!isThereAddress && isThereAddress 
        )
        .do();

      // get choice balance of the ASA
      const balance = myAccountInfo.assets
        ? myAccountInfo.assets.find(
            (element) => element["asset-id"] === ASSET_ID
          ).amount / 100
        : 0;

     //get algo balance of the ASA
      const algoBalance = myAccountInfo.amount/1000000;

     
      // check if the voter address has Choice
      const containsChoice = myAccountInfo.assets
        ? myAccountInfo.assets.some(
            (element) => element["asset-id"] === ASSET_ID
          )
        : false;
             
     

      // if the address has no ASAs
      if (myAccountInfo.assets.length === 0) {
        dispatch({
          type: "alert_modal",
          alertContent:
            "You need to opt-in to Choice Coin in your Wallet to process payment reward.",
        });
        return;
      }

      if (!containsChoice) {
        dispatch({
          type: "alert_modal",
          alertContent:
            "You need to opt-in to Choice Coin in your Algorand Wallet to process payment reward..",
        });
        return;
      }

      if ( RewardsInchoice > balance) {
        dispatch({
          type: "alert_modal",
          alertContent:
            "You do not have sufficient balance in $Choice to make this transaction.",
        });
        return;
      }
    if (ServiceInAlgo > algoBalance) {
      dispatch({
        type: "alert_modal",
        alertContent:
          "You do not have sufficient balance in $Algo to make this transaction.",
      });
      return;
    }

  
      const suggestedParams = await algodClient.getTransactionParams().do();
     
      const amountToSend = RewardsInchoice * 100;
      const amountInAlgo = ServiceInAlgo * 1000000;
  
      const txn1 = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        from: address,
        to: rewardsAddress,
        amount: amountToSend,
        assetIndex: ASSET_ID,
        suggestedParams,
      });

      const tnx2 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: address,
        to: serviceAddress,
        amount : amountInAlgo,
        suggestedParams,
      })

      let txns = [txn1, tnx2]
       algosdk.assignGroupID(txns);

      let Txns = [txn1.toByte(), tnx2.toByte()]

      

      const signedTxn = await myAlgoWallet.signTransaction(Txns);
      const SignedTx = signedTxn.map((txn) => {
        return txn.blob;
      });

      console.log(SignedTx)

      

      const resp = await algodClient.sendRawTransaction(SignedTx).do();
      if(resp) {
        const headers  =  {'Content-Type': 'application/json'} 
       await  axios.post('https://tita-backend.herokuapp.com/data', {
          name : governanceName,
          date : date,
          rewards : RewardsInchoice,
          service : ServiceInAlgo,
          issue : governanceIssue,
          option1 : governanceOption1,
          option2 : governanceOption2,
        }, {headers }).then(response => {
          console.log(response)
        },(err) => {
          console.log(err)
        } )
      }

      console.log(resp, 'resp')

      // alert success
      dispatch({
        type: "alert_modal",
        alertContent: "Rewards & Service fees has been recorded, check schedule for governance scheduling.",
      });
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      if (error.message === "Can not open popup window - blocked") {
        dispatch({
          type: "alert_modal",
          alertContent:
            "Pop Up windows blocked by your browser. Enable pop ups to continue.",
        });
      } else {
        console.log(error)
        dispatch({
          type: "alert_modal",
          alertContent: "An error occured the during transaction process",
        });
      }
    }
  };

  const algoSignerConnect = async () => {
    const RewardsInchoice = document.getElementById('rewards').value
    const ServiceInAlgo = document.getElementById('service').value
    const governanceName = document.getElementById('governance').value
    const governanceIssue = document.getElementById('issue').value
    const governanceOption1 = document.getElementById('option-1').value
    const governanceOption2 = document.getElementById('option-2').value

    try {
 

        const address = !!isThereAddress && isThereAddress 

        const myAccountInfo = await algodClient
          .accountInformation(
            !!isThereAddress && isThereAddress
          )
          .do();

        // get balance of the voter
        const balance = myAccountInfo.assets
          ? myAccountInfo.assets.find(
              (element) => element["asset-id"] === ASSET_ID
            ).amount / 100
          : 0;

         //get algo balance of the ASA
      const algoBalance = myAccountInfo.amount/1000000;

        // check if the ASA payment address has Choice Opt-in
        const containsChoice = myAccountInfo.assets
          ? myAccountInfo.assets.some(
              (element) => element["asset-id"] === ASSET_ID
            )
          : false;

        // if the address has no ASAs
        if (myAccountInfo.assets.length === 0) {
          dispatch({
            type: "alert_modal",
            alertContent:
              "You need to opt-in to Choice Coin in your Wallet to process payment reward.",
          });
          return;
        }

        if (!containsChoice) {
          dispatch({
            type: "alert_modal",
            alertContent:
              "You need to opt-in to Choice Coin in your Wallet to process payment reward.",
          });
          return;
        }

        if (RewardsInchoice > balance) {
          dispatch({
            type: "alert_modal",
            alertContent:
              "You do not have sufficient balance in $Choice to make this transaction.",
          });
          return;
        }

        if (ServiceInAlgo > algoBalance) {
          dispatch({
            type: "alert_modal",
            alertContent:
              "You do not have sufficient balance in $Algo to make this transaction.",
          });
          return;
        }

        const suggestedParams = await algodClient.getTransactionParams().do();
        const amountToSend = RewardsInchoice * 100;
        const amountInAlgo = ServiceInAlgo * 1000000;
    

        const txn1 = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
          from: address,
          to: rewardsAddress,
          amount: amountToSend,
          assetIndex: ASSET_ID,
          suggestedParams,
        });

        const txn2 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
          from: address,
          to: serviceAddress,
          amount : amountInAlgo,
          suggestedParams,
        })

        let txns = [txn1, txn2]
        algosdk.assignGroupID(txns);

        let Txns = []
        // eslint-disable-next-line
        txns.map((transaction) => {
          Txns.push({
            txn: window.AlgoSigner.encoding.msgpackToBase64(transaction.toByte()),
          });
        })


        const signedTxn = await window.AlgoSigner.signTxn(Txns);

        const SignedTx = signedTxn.map((txn) => {
          return  window.AlgoSigner.encoding.base64ToMsgpack(txn.blob);
        });
     

        const resp = await algodClient
          .sendRawTransaction(SignedTx).do();

          if(resp) {
            const headers  =  {'Content-Type': 'application/json'} 
           await  axios.post('https://tita-backend.herokuapp.com/data', {
              name : governanceName,
              date : date,
              rewards : RewardsInchoice,
              service : ServiceInAlgo,
              issue : governanceIssue,
              option1 : governanceOption1,
              option2 : governanceOption2,
            }, {headers }).then(response => {
              console.log(response)
            },(err) => {
              console.log(err)
            } )
          }

        // alert success
        dispatch({
          type: "alert_modal",
          alertContent: "Rewards & Service fees has been recorded, check schedule page for governance scheduling.",
        });
        setTimeout(() => window.location.reload(), 1500);
      
    } catch (error) {
      if (error.message === "Can not open popup window - blocked") {
        dispatch({
          type: "alert_modal",
          alertContent:
            "Pop Up windows blocked by your browser. Enable pop ups to continue.",
        });
      } else {
        console.log(error);
        dispatch({
          type: "alert_modal",
          alertContent: "An error occured the during transaction process",
        });
      }
    }
  };

  const algoMobileConnect = async () => {
    const connector = new WalletConnect({
      bridge: "https://bridge.walletconnect.org",
      qrcodeModal: QRCodeModal,
    });

    const RewardsInchoice = document.getElementById('rewards').value
    const ServiceInAlgo = document.getElementById('service').value
    const governanceName = document.getElementById('governance').value
    const governanceIssue = document.getElementById('issue').value
    const governanceOption1 = document.getElementById('option-1').value
    const governanceOption2 = document.getElementById('option-2').value

    try {
      const address = !!isThereAddress ? isThereAddress : "";

      const myAccountInfo = await algodClient.accountInformation(address).do();

      const balance = myAccountInfo.assets
        ? myAccountInfo.assets.find(
            (element) => element["asset-id"] === ASSET_ID
          ).amount / 100
        : 0;

          //get algo balance of the ASA
      const algoBalance = myAccountInfo.amount/1000000;

      const containsChoice = myAccountInfo.assets
        ? myAccountInfo.assets.some(
            (element) => element["asset-id"] === ASSET_ID
          )
        : false;

        

      if (myAccountInfo.assets.length === 0) {
        alert("You need to opt-in to Choice Coin in your Wallet to process payment reward.");
        return;
      }

      if (!containsChoice) {
        alert("You need to opt-in to Choice Coin in your Wallet to process payment reward.");
        return;
      }

      if (RewardsInchoice > balance) {
        alert("You do not have sufficient balance in $Choice to make this transaction.");
        return;
      }

      if (ServiceInAlgo > algoBalance) {
        dispatch({
          type: "alert_modal",
          alertContent:
            "You do not have sufficient balance in $Algo to make this transaction.",
        });
        return;
      }

      const suggestedParams = await algodClient.getTransactionParams().do();
      const amountToSend = RewardsInchoice * 100;
      const amountInAlgo = ServiceInAlgo * 1000000;
     
      const txn1 = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        from: address,
        to: rewardsAddress,
        amount: amountToSend,
        assetIndex: ASSET_ID,
        suggestedParams,
        
      });

      const txn2 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: address,
        to: serviceAddress,
        amount : amountInAlgo,
        suggestedParams,
      })
      let txns = [txn1, txn2]
      algosdk.assignGroupID(txns);
      let Txns = []

      // eslint-disable-next-line
      txns.map((transaction) => {

        Txns.push({
          txn: Buffer.from(algosdk.encodeUnsignedTransaction(transaction)).toString(
            "base64"
          ),
          message: "Transaction using Mobile Wallet",
        })
      })


      const requestParams = [Txns];

      const request = formatJsonRpcRequest("algo_signTxn", requestParams);
      const result = await connector.sendCustomRequest(request);

      const decodedResult = result.map((element) => {
        return element ? new Uint8Array(Buffer.from(element, "base64")) : null;
      });

   
    const resp = await algodClient.sendRawTransaction(decodedResult).do();

    if(resp) {
      const headers  =  {'Content-Type': 'application/json'} 
     await  axios.post('https://tita-backend.herokuapp.com/data', {
        name : governanceName,
        date : date,
        rewards : RewardsInchoice,
        service : ServiceInAlgo,
        issue : governanceIssue,
        option1 : governanceOption1,
        option2 : governanceOption2,
      }, {headers }).then(response => {
        console.log(response)
      },(err) => {
        console.log(err)
      } )
    }
      // alert success
      dispatch({
        type: "alert_modal",
        alertContent: "Rewards & Service fees has been recorded, check schedule page for governance scheduling.",
      });

      setTimeout(() => window.location.reload(), 1500);

    } 
     catch (error) {
      if (error.message === "Can not open popup window - blocked") {
        dispatch({
          type: "alert_modal",
          alertContent:
            "Pop Up windows blocked by your browser. Enable pop ups to continue.",
        });
      } else {
        dispatch({
          type: "alert_modal",
          alertContent: "An error occured during the transaction process",
        });
      }
    }
  };

  const makePayment = () => {

        

    if(!isThereAddress) {
      dispatch({
        type: "alert_modal",
        alertContent: "Kindly Connect Wallet To Make Payment.",
      });
      return;
  } else if(!(document.getElementById('governance').value)) {
    dispatch({
      type: "alert_modal",
      alertContent: "You didn't enter governance name.",
    });
    return;
  }
    
   else if(!(document.getElementById('rewards').value)) {
      dispatch({
        type: "alert_modal",
        alertContent: "Enter Choice Rewards for Governance.",
      });
      return;
    } else if (!(document.getElementById('service').value)) {
      dispatch({
        type: "alert_modal",
        alertContent: "Enter Service Fee for Governance.",
      });
      return;
    } else if (!(document.getElementById('issue').value)) {
      dispatch({
        type: "alert_modal",
        alertContent: "Voting issue for governance not found.",
      });
      return;
    } else if (!(document.getElementById('option-1').value)) {
      dispatch({
        type: "alert_modal",
        alertContent: "Enter what option 1 should be ?",
      });
      return;
    } else if (!(document.getElementById('option-2').value)) {
      dispatch({
        type: "alert_modal",
        alertContent: "Enter what option 2 should be ?",
      });
      return;
    } else if (!date) {
      dispatch({
        type: "alert_modal",
        alertContent: "Governance date is not included",
      });
      return;
    }
    
    else if(date < new Date().toISOString()) {
      dispatch({
            type: "alert_modal",
            alertContent: "Kindly select an active Governance date",
          });
          return;
    } else if (date === ASAdata) {
             //get already asadate
 
        // console.log(asa)
         dispatch({
           type: "alert_modal",
           alertContent:
             "Date has been scheduled to another asa, pick another Monday!.",
         });
         return;
  
  } else if((document.getElementById('rewards').value) < 500000) {
    dispatch({
      type: "alert_modal",
      alertContent:
        "Minimum rewards fees is 500,000 $Choice.",
    });
    return;
  } else if((document.getElementById('service').value) < 500) {
    dispatch({
      type: "alert_modal",
      alertContent:
        "Minimum service fees is 500 $Algo.",
    });
    return;
  }
 
    
    
    
    if (walletType === "my-algo") {
      myAlgoSign();
    } else if (walletType === "algosigner") {
      algoSignerConnect();
    } else if (walletType === "walletconnect") {
      algoMobileConnect();
    }
   
  };


  return (
    <div className="ptt_elt">
      <div className="ptt_elt_inn">
        <div className="ptt_hd">
          <p> Choice Coin ASA Governance Payment Gateway</p>
        </div>

        <ul className="card_list">
          {election_data?.map((slug, index) => {
            return (
              <div className="card_cont" key={index}>
                <div className="card_r1">
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <div className="card_elt_img">
                      {slug.process_image ? (
                        <img src={slug.process_image} alt="" />
                      ) : (
                        <i
                          className="uil uil-asterisk"
                          style={{ paddingLeft: "2px", paddingBottom: "2px" }}
                        />
                      )}
                    </div>
                    <div className="card_elt_tit">{slug.title}</div>
                  </div>
                </div>

                <div className="card_elt_desc">{slug?.card_desc}</div>
                <div className="voting_ends">Governance only holds on Mondays, Check for a free Monday for scheduling!
                </div>

                <div className="card_cand">
                <div className="card_cand_hd">
                    <div className="amountToCommit">
                      <p>Enter ASA Governance name:</p>
                      <input
                        id="governance"
                        type="text"
                        placeholder='Governance'
                        className="amtToCommitInp"
                      />
                      
                    </div>
                  </div>
                  <div className="card_cand_hd">
                    <div className="amountToCommit">
                      <p>Enter Choice Rewards:</p>
                      <input
                        id="rewards"
                        type="number"
                        min="500000"
                        placeholder='500,000 $Choice'
                        className="amtToCommitInp"
                      />
                      
                    </div>
                  </div>
                  <div className="card_cand_hd">
                    <div className="amountToCommit">
                      <p>Enter Service Fee:</p>
                      <input
                        id="service"
                        type="number"
                        min="500"
                        placeholder='500 $Algo'
                        className="amtToCommitInp"
                      />
                    </div>
                  </div>
                  <div className="card_cand_hd">
                    <div className="amountToCommit">
                      <p>Enter Voting Issue:</p>
                      <input
                        id="issue"
                        type="text"
                        placeholder='Enter voting issue?'
                        className="amtToCommitInp"
                      />
                      
                    </div>
                  </div>
                  <div className="card_cand_hd">
                    <div className="amountToCommit">
                      <p>Enter Option 1:</p>
                      <input
                        id="option-1"
                        type="text"
                       
                        placeholder='Enter Option 1'
                        className="amtToCommitInp"
                      />
                      
                    </div>
                  </div>
                  <div className="card_cand_hd">
                    <div className="amountToCommit">
                      <p>Enter option 2:</p>
                      <input
                        id="option-2"
                        type="text"
                        placeholder='Enter Option 2'
                        className="amtToCommitInp"
                      />
                      
                    </div>
                  </div>
                  <div className="card_cand_hd">
                    <div className="amountToCommit">
                      <p>Date For Governance:</p>
                      {/* <input
                        id="date"
                        type="date"
                        placeholder=''
                        className="amtToCommitInp"
                      /> */}
                       <DatePicker 
                          // excludeDates={[(new Date("2022-04-11")),  subDays(new Date("2022-04-18")),  subDays(new Date("2022-04-25"))]}
                          excludeDates={[(new Date("2022-04-11")), (new Date("2022-04-18")),(new Date("2022-04-25")) ]}
                          selected={date && new Date(dateRange.startDate)}
                          onChange={handleDateChange}
                          name="startDate"
                          filterDate={(date) => date.getDay() === 1 }
                          placeholderText="Monday📆"
                          
                        />
             
                    </div>
                  </div>

                  <div className="vote_collap">

                    <div className="rec_vote_cont">
                      <button
                        className="record_vote"
                        onClick={() => {
                          makePayment();
                        }}
                      >
                        Make Payment <i className="uil uil-wallet"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </ul>
      </div>
      <BottomNavigationBar txt="Check schedule?"/>
    </div>
  );
};

export default Payment;
