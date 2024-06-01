// import { useState } from 'react';
// import Form from 'react-bootstrap/Form';
// import Button from 'react-bootstrap/Button';
// import Row from 'react-bootstrap/Row';
// import Col from 'react-bootstrap/Col';
// import Spinner from 'react-bootstrap/Spinner';
// import { ethers } from 'ethers'

// const Buy = ({ provider, price, crowdsale, setIsLoading }) => {
//     const [amount, setAmount] = useState('0')
//     const [isWaiting, setIsWaiting] = useState(false)

//     const buyHandler = async (e) => {
//         e.preventDefault()
//         setIsWaiting(true)

//         try {
//             let signer = await provider.getSigner()

//             // We need to calculate the required ETH in order to buy the tokens...
//             // (_amount / 1e18) * price
//             let tokenAmountWei = ethers.utils.parseUnits(amount.toString(), 'ether') //becomes amount in wei
//             // let value = ethers.utils.parseUnits((amount / 1e18 * price).toString(), 'ether') //
//             let valueEtherWei = ethers.utils.parseUnits((amount * price).toString(), 'ether') // amount flat, price in wei

//             let transaction = await crowdsale.connect(signer).buyTokens(tokenAmountWei, { value: valueEtherWei })
//             await transaction.wait()
//         } catch {
//             // console.log('signer', await provider.getSigner())
//             const signer = await provider.getSigner();

//             console.log('amount flat', amount); //flat amount comes from this component, so probably '100'
//             console.log('price flat', price); //0.00025
//             console.log('signer address', await signer.getAddress());
//             console.log('tokenAmountWei', ethers.utils.parseUnits(amount.toString(), 'ether').toString())
//             console.log('valueEtherWei', ethers.utils.parseUnits((amount * price).toString(), 'ether').toString())
            
//             window.alert('User rejected or transaction reverted')
//         }

//         setIsLoading(true)
//     }

//     return (
//         <Form onSubmit={buyHandler} style={{ maxWidth: '800px', margin: '50px auto' }}>
//             <Form.Group as={Row}>
//                 <Col>
//                     <Form.Control type="number" placeholder="Enter amount" onChange={(e) => setAmount(e.target.value)} />
//                 </Col>
//                 <Col className='text-center'>
//                     {isWaiting ? (
//                         <Spinner animation="border" />
//                     ) : (
//                         <Button variant="primary" type="submit" style={{ width: '100%' }}>
//                             Buy Tokens
//                         </Button>
//                     )}
//                 </Col>
//             </Form.Group>
//         </Form>
//     );
// }

// export default Buy;