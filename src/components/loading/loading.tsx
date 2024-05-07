import React from 'react';
import styles from '../../styles/loading.module.css'

type Props = {
    
};

const Loading: React.FC<Props> = ({  }) => {

    return (
        <div className={styles.container}>
            <h1>loading ...</h1>
        </div>
    );
};

export default Loading;