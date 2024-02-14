const Info = ({ account, userTokenAmountWei, icoStart, icoEnd }) => {
	return(
		<div>
			<p><strong>Account: </strong>{account}</p>
			<p><strong>Tokens Owned: </strong>{userTokenAmountWei}</p>
			<p><strong>ICO Start Date: </strong>{icoStart}</p>
			<p><strong>ICO End Date: </strong>{icoEnd}</p>
		</div>
	)
}

export default Info;
