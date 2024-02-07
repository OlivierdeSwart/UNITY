const Info = ({ account, accountBalance, userTokenAmount }) => {
	return(
		<div>
			<p><strong>Account: </strong>{account}</p>
			<p><strong>Tokens Owned: </strong>{userTokenAmount}</p>
			<p><strong>ICO Start Date: </strong>{accountBalance}</p>
			<p><strong>ICO End Date: </strong>{accountBalance}</p>
		</div>
	)
}

export default Info;
